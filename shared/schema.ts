import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  createdAt: text("created_at").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
});

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email().optional().nullable(),
  createdAt: z.string(),
  stripeCustomerId: z.string().optional().nullable(),
  stripeSubscriptionId: z.string().optional().nullable(),
}).pick({
  username: true,
  password: true,
  email: true,
  createdAt: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true
});

export const registerUserSchema = insertUserSchema.extend({
  confirmPassword: z.string()
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Package schema
export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(), // Price in cents
  trialCount: integer("trial_count").notNull(),
  features: jsonb("features").notNull(), // Array of feature strings
  isBestValue: boolean("is_best_value").default(false),
  icon: text("icon").notNull(),
});

export const insertPackageSchema = createInsertSchema(packages).omit({
  id: true,
});

export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type Package = typeof packages.$inferSelect;

// UserPackage schema
export const userPackages = pgTable("user_packages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  packageId: integer("package_id").notNull(),
  purchasedAt: text("purchased_at").notNull(), // ISO date string
  trialsRemaining: integer("trials_remaining").notNull(),
  isActive: boolean("is_active").default(true),
});

export const insertUserPackageSchema = createInsertSchema(userPackages).omit({
  id: true,
});

export type InsertUserPackage = z.infer<typeof insertUserPackageSchema>;
export type UserPackage = typeof userPackages.$inferSelect;

// Note schema
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  updatedAt: text("updated_at").notNull(), // ISO date string
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
});

export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;

// Command execution schema
export const commandExecutions = pgTable("command_executions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  command: text("command").notNull(),
  serviceName: text("service_name").notNull(), 
  status: text("status").notNull(), // 'success', 'error', 'pending'
  message: text("message").notNull(),
  executedAt: text("executed_at").notNull(), // ISO date string
});

export const insertCommandExecutionSchema = createInsertSchema(commandExecutions).omit({
  id: true,
});

export type InsertCommandExecution = z.infer<typeof insertCommandExecutionSchema>;
export type CommandExecution = typeof commandExecutions.$inferSelect;

// For API responses
export const packageResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  trialCount: z.number(),
  features: z.array(z.string()),
  isBestValue: z.boolean(),
  icon: z.string(),
});

export const userPackageResponseSchema = z.object({
  id: z.number(),
  packageId: z.number(),
  packageName: z.string(),
  purchasedAt: z.string(),
  trialsRemaining: z.number(),
  isActive: z.boolean(),
});

export const commandResponseSchema = z.object({
  id: z.number(),
  command: z.string(),
  serviceName: z.string(),
  status: z.string(),
  message: z.string(),
  executedAt: z.string(),
});

export type PackageResponse = z.infer<typeof packageResponseSchema>;
export type UserPackageResponse = z.infer<typeof userPackageResponseSchema>;
export type CommandResponse = z.infer<typeof commandResponseSchema>;
