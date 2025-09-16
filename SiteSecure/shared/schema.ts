import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  role: text("role").notNull().default("guest"), // guest, admin, owner
  createdAt: timestamp("created_at").defaultNow(),
});

export const donations = pgTable("donations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  donorName: text("donor_name"),
  donorEmail: text("donor_email"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  paymentMethod: text("payment_method").notNull(), // paypal, stripe, gcash
  paymentReference: text("payment_reference"),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  isAnonymous: boolean("is_anonymous").default(false),
  donationType: text("donation_type").default("one-time"), // one-time, monthly
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contactMessages = pgTable("contact_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  inquiryType: text("inquiry_type").notNull(),
  message: text("message").notNull(),
  subscribeUpdates: boolean("subscribe_updates").default(false),
  status: text("status").default("unread"), // unread, read, responded
  createdAt: timestamp("created_at").defaultNow(),
});

export const gcashPayments = pgTable("gcash_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  donationId: varchar("donation_id").references(() => donations.id),
  referenceNumber: text("reference_number").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  senderNumber: text("sender_number"),
  status: text("status").default("pending"), // pending, verified, rejected
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  data: text("data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertDonationSchema = createInsertSchema(donations).omit({
  id: true,
  createdAt: true,
  verifiedAt: true,
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
});

export const insertGCashPaymentSchema = createInsertSchema(gcashPayments).omit({
  id: true,
  createdAt: true,
  verifiedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Donation = typeof donations.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;

export type GCashPayment = typeof gcashPayments.$inferSelect;
export type InsertGCashPayment = z.infer<typeof insertGCashPaymentSchema>;

export type Session = typeof sessions.$inferSelect;
