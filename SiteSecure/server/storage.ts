import { type User, type InsertUser, type Donation, type InsertDonation, type ContactMessage, type InsertContactMessage, type GCashPayment, type InsertGCashPayment, type Session } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Session management
  createSession(userId: string, expiresAt: Date, data?: string): Promise<Session>;
  getSession(sessionId: string): Promise<Session | undefined>;
  deleteSession(sessionId: string): Promise<void>;
  
  // Donation management
  createDonation(donation: InsertDonation): Promise<Donation>;
  getDonation(id: string): Promise<Donation | undefined>;
  updateDonation(id: string, updates: Partial<Donation>): Promise<Donation | undefined>;
  getDonations(limit?: number, offset?: number): Promise<Donation[]>;
  getDonationsByStatus(status: string): Promise<Donation[]>;
  
  // Contact messages
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(limit?: number, offset?: number): Promise<ContactMessage[]>;
  updateContactMessage(id: string, updates: Partial<ContactMessage>): Promise<ContactMessage | undefined>;
  
  // GCash payment verification
  createGCashPayment(payment: InsertGCashPayment): Promise<GCashPayment>;
  getGCashPayment(id: string): Promise<GCashPayment | undefined>;
  getGCashPaymentByReference(referenceNumber: string): Promise<GCashPayment | undefined>;
  updateGCashPayment(id: string, updates: Partial<GCashPayment>): Promise<GCashPayment | undefined>;
  getPendingGCashPayments(): Promise<GCashPayment[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, Session> = new Map();
  private donations: Map<string, Donation> = new Map();
  private contactMessages: Map<string, ContactMessage> = new Map();
  private gcashPayments: Map<string, GCashPayment> = new Map();

  constructor() {
    // Initialize with default admin and owner accounts
    this.createUser({
      username: "admin",
      password: "admin123", // In production, this should be hashed
      email: "admin@sitesecure.org",
      role: "admin"
    });
    
    this.createUser({
      username: "owner",
      password: "owner123", // In production, this should be hashed
      email: "owner@sitesecure.org",
      role: "owner"
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email ?? null,
      role: insertUser.role ?? "user",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createSession(userId: string, expiresAt: Date, data?: string): Promise<Session> {
    const id = randomUUID();
    const session: Session = {
      id,
      userId,
      expiresAt,
      data: data || null,
      createdAt: new Date(),
    };
    this.sessions.set(id, session);
    return session;
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    
    // Check if session is expired
    if (session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return undefined;
    }
    
    return session;
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async createDonation(donation: InsertDonation): Promise<Donation> {
    const id = randomUUID();
    const newDonation: Donation = {
      id,
      amount: donation.amount,
      currency: donation.currency ?? "USD",
      donorName: donation.donorName ?? null,
      donorEmail: donation.donorEmail ?? null,
      paymentMethod: donation.paymentMethod,
      paymentReference: donation.paymentReference ?? null,
      status: donation.status ?? "pending",
      isAnonymous: donation.isAnonymous ?? null,
      donationType: donation.donationType ?? null,
      createdAt: new Date(),
      verifiedAt: null,
    };
    this.donations.set(id, newDonation);
    return newDonation;
  }

  async getDonation(id: string): Promise<Donation | undefined> {
    return this.donations.get(id);
  }

  async updateDonation(id: string, updates: Partial<Donation>): Promise<Donation | undefined> {
    const donation = this.donations.get(id);
    if (!donation) return undefined;
    
    const updatedDonation = { ...donation, ...updates };
    this.donations.set(id, updatedDonation);
    return updatedDonation;
  }

  async getDonations(limit: number = 50, offset: number = 0): Promise<Donation[]> {
    const donations = Array.from(this.donations.values())
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(offset, offset + limit);
    return donations;
  }

  async getDonationsByStatus(status: string): Promise<Donation[]> {
    return Array.from(this.donations.values())
      .filter(donation => donation.status === status)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const id = randomUUID();
    const newMessage: ContactMessage = {
      id,
      firstName: message.firstName,
      lastName: message.lastName,
      email: message.email,
      subject: message.subject,
      inquiryType: message.inquiryType,
      message: message.message,
      subscribeUpdates: message.subscribeUpdates ?? null,
      status: message.status ?? null,
      createdAt: new Date(),
    };
    this.contactMessages.set(id, newMessage);
    return newMessage;
  }

  async getContactMessages(limit: number = 50, offset: number = 0): Promise<ContactMessage[]> {
    const messages = Array.from(this.contactMessages.values())
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(offset, offset + limit);
    return messages;
  }

  async updateContactMessage(id: string, updates: Partial<ContactMessage>): Promise<ContactMessage | undefined> {
    const message = this.contactMessages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, ...updates };
    this.contactMessages.set(id, updatedMessage);
    return updatedMessage;
  }

  async createGCashPayment(payment: InsertGCashPayment): Promise<GCashPayment> {
    const id = randomUUID();
    const newPayment: GCashPayment = {
      id,
      amount: payment.amount,
      referenceNumber: payment.referenceNumber,
      status: payment.status ?? null,
      donationId: payment.donationId ?? null,
      senderNumber: payment.senderNumber ?? null,
      verifiedBy: payment.verifiedBy ?? null,
      createdAt: new Date(),
      verifiedAt: null,
    };
    this.gcashPayments.set(id, newPayment);
    return newPayment;
  }

  async getGCashPayment(id: string): Promise<GCashPayment | undefined> {
    return this.gcashPayments.get(id);
  }

  async getGCashPaymentByReference(referenceNumber: string): Promise<GCashPayment | undefined> {
    return Array.from(this.gcashPayments.values())
      .find(payment => payment.referenceNumber === referenceNumber);
  }

  async updateGCashPayment(id: string, updates: Partial<GCashPayment>): Promise<GCashPayment | undefined> {
    const payment = this.gcashPayments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = { ...payment, ...updates };
    this.gcashPayments.set(id, updatedPayment);
    return updatedPayment;
  }

  async getPendingGCashPayments(): Promise<GCashPayment[]> {
    return Array.from(this.gcashPayments.values())
      .filter(payment => payment.status === "pending")
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }
}

export const storage = new MemStorage();
