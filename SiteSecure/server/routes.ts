import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDonationSchema, insertContactMessageSchema, insertGCashPaymentSchema } from "@shared/schema";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import Stripe from "stripe";
import { randomUUID } from "crypto";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-08-27.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication middleware
  const requireAuth = (roles: string[] = []) => {
    return async (req: any, res: any, next: any) => {
      const sessionId = req.headers.authorization?.replace('Bearer ', '');
      if (!sessionId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(401).json({ error: "Invalid session" });
      }

      const user = await storage.getUser(session.userId!);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (roles.length > 0 && !roles.includes(user.role)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      req.user = user;
      req.session = session;
      next();
    };
  };

  // PayPal routes
  app.get("/api/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/api/paypal/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, currency = "USD" } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password, portal } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check portal access
      if (portal === "admin" && user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      if (portal === "owner" && user.role !== "owner") {
        return res.status(403).json({ error: "Owner access required" });
      }

      // Create session
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const session = await storage.createSession(user.id, expiresAt);

      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: user.role 
        }, 
        sessionId: session.id 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", requireAuth(), async (req: any, res) => {
    try {
      await storage.deleteSession(req.session.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Donation routes
  app.post("/api/donations", async (req, res) => {
    try {
      const donationData = insertDonationSchema.parse(req.body);
      const donation = await storage.createDonation(donationData);
      res.json(donation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/donations", requireAuth(["admin", "owner"]), async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const donations = await storage.getDonations(limit, offset);
      res.json(donations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/donations/:id", requireAuth(["admin", "owner"]), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const donation = await storage.updateDonation(id, updates);
      
      if (!donation) {
        return res.status(404).json({ error: "Donation not found" });
      }
      
      res.json(donation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GCash payment routes
  app.post("/api/gcash/submit", async (req, res) => {
    try {
      const { donationId, referenceNumber, amount, senderNumber } = req.body;
      
      // Check if reference already exists
      const existingPayment = await storage.getGCashPaymentByReference(referenceNumber);
      if (existingPayment) {
        return res.status(400).json({ error: "Reference number already submitted" });
      }

      const gcashPayment = await storage.createGCashPayment({
        donationId,
        referenceNumber,
        amount: amount.toString(),
        senderNumber,
        status: "pending"
      });

      res.json(gcashPayment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/gcash/pending", requireAuth(["admin", "owner"]), async (req, res) => {
    try {
      const payments = await storage.getPendingGCashPayments();
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/gcash/:id/verify", requireAuth(["admin", "owner"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'verified' or 'rejected'
      
      const payment = await storage.updateGCashPayment(id, {
        status,
        verifiedBy: req.user.id,
        verifiedAt: new Date()
      });

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      // Update associated donation status
      if (payment.donationId && status === "verified") {
        await storage.updateDonation(payment.donationId, {
          status: "completed",
          verifiedAt: new Date()
        });
      }

      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Contact message routes
  app.post("/api/contact", async (req, res) => {
    try {
      const messageData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(messageData);
      res.json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/contact", requireAuth(["admin", "owner"]), async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const messages = await storage.getContactMessages(limit, offset);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Dashboard stats routes
  app.get("/api/stats/admin", requireAuth(["admin"]), async (req, res) => {
    try {
      const donations = await storage.getDonations();
      const messages = await storage.getContactMessages();
      const pendingGCash = await storage.getPendingGCashPayments();
      
      const stats = {
        totalDonations: donations.reduce((sum, d) => sum + parseFloat(d.amount), 0),
        donationCount: donations.length,
        pendingMessages: messages.filter(m => m.status === "unread").length,
        pendingGCashPayments: pendingGCash.length,
      };
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/stats/owner", requireAuth(["owner"]), async (req, res) => {
    try {
      const donations = await storage.getDonations();
      const completedDonations = donations.filter(d => d.status === "completed");
      
      // Calculate payment method breakdown
      const paymentMethods = completedDonations.reduce((acc, d) => {
        acc[d.paymentMethod] = (acc[d.paymentMethod] || 0) + parseFloat(d.amount);
        return acc;
      }, {} as Record<string, number>);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = completedDonations
        .filter(d => d.createdAt?.getMonth() === currentMonth && d.createdAt?.getFullYear() === currentYear)
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);

      const stats = {
        totalRevenue: completedDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0),
        monthlyRevenue,
        activeDonors: new Set(completedDonations.map(d => d.donorEmail)).size,
        paymentMethods,
        growthRate: 15.3, // This would be calculated based on historical data
      };
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
