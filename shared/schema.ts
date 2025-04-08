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
  googleId: text("google_id"),
  facebookId: text("facebook_id"),
});

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email().optional().nullable(),
  createdAt: z.string(),
  stripeCustomerId: z.string().optional().nullable(),
  stripeSubscriptionId: z.string().optional().nullable(),
  googleId: z.string().optional().nullable(),
  facebookId: z.string().optional().nullable(),
}).pick({
  username: true,
  password: true,
  email: true,
  createdAt: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  googleId: true,
  facebookId: true
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
  // New fields for subscription tracking
  isSubscription: boolean("is_subscription").default(false),
  renewalDate: text("renewal_date"), // ISO date string for next renewal
  trialLimitPerCycle: integer("trial_limit_per_cycle"), // Maximum trials allowed per cycle
  trialsUsedInCycle: integer("trials_used_in_cycle").default(0), // Trials used in current cycle
  transactionId: text("transaction_id"), // Blockchain transaction ID
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
  title: text("title").default(""),
  content: text("content").notNull(),
  color: text("color").default("yellow"), // yellow, green, pink, blue, purple, orange
  backgroundColor: text("background_color").default(""), // For custom background colors
  textAlign: text("text_align").default("left"), // left, center, right
  fontSize: text("font_size").default("normal"), // small, normal, large
  isPinned: boolean("is_pinned").default(false),
  isArchived: boolean("is_archived").default(false),
  attachments: text("attachments").array().default([]), // Array of attachment URLs
  drawingData: text("drawing_data").default(""), // SVG or Canvas data for drawings
  emojis: text("emojis").default("{}"), // JSON string with emoji reactions
  tags: text("tags").array().default([]), // Array of tags
  createdAt: text("created_at").notNull(), // ISO date string
  updatedAt: text("updated_at").notNull(), // ISO date string
});

export const insertNoteSchema = createInsertSchema(notes, {
  title: z.string().optional(),
  color: z.enum(["yellow", "green", "pink", "blue", "purple", "orange"]).optional(),
  backgroundColor: z.string().optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
  fontSize: z.enum(["small", "normal", "large"]).optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  attachments: z.array(z.string()).optional(),
  drawingData: z.string().optional(),
  emojis: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string(),
}).omit({
  id: true,
});

export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;

// Note response schema
export const noteResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  color: z.enum(["yellow", "green", "pink", "blue", "purple", "orange"]),
  backgroundColor: z.string().optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
  fontSize: z.enum(["small", "normal", "large"]).optional(),
  isPinned: z.boolean(),
  isArchived: z.boolean(),
  attachments: z.array(z.string()).optional(),
  drawingData: z.string().optional(),
  emojis: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

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
  isSubscription: z.boolean().optional(),
  renewalDate: z.string().optional(),
  trialLimitPerCycle: z.number().optional(),
  trialsUsedInCycle: z.number().optional(),
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
// AI Team Member schema
export const aiTeamMembers = pgTable("ai_team_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  model: text("model").notNull(), // 'claude-3-7-sonnet-20250219', 'gpt-4o', etc.
  provider: text("provider").notNull(), // 'anthropic', 'openai'
  avatarColor: text("avatar_color").default("blue"), // blue, green, pink, purple, orange, yellow
  systemPrompt: text("system_prompt").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: text("created_at").notNull(), // ISO date string
});

export const insertAiTeamMemberSchema = createInsertSchema(aiTeamMembers, {
  avatarColor: z.enum(["blue", "green", "pink", "purple", "orange", "yellow"]).optional(),
  isActive: z.boolean().optional(),
  createdAt: z.string(),
}).omit({
  id: true,
});

export type InsertAiTeamMember = z.infer<typeof insertAiTeamMemberSchema>;
export type AiTeamMember = typeof aiTeamMembers.$inferSelect;

// AI Chat Message schema
export const aiChatMessages = pgTable("ai_chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  aiTeamMemberId: integer("ai_team_member_id").notNull(),
  content: text("content").notNull(),
  isUserMessage: boolean("is_user_message").notNull(),
  timestamp: text("timestamp").notNull(), // ISO date string
  noteId: integer("note_id"), // Optional relation to a note
});

export const insertAiChatMessageSchema = createInsertSchema(aiChatMessages, {
  noteId: z.number().optional().nullable(),
  timestamp: z.string(),
}).omit({
  id: true,
});

export type InsertAiChatMessage = z.infer<typeof insertAiChatMessageSchema>;
export type AiChatMessage = typeof aiChatMessages.$inferSelect;

// Response schemas
export const aiTeamMemberResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  role: z.string(),
  model: z.string(),
  provider: z.string(),
  avatarColor: z.enum(["blue", "green", "pink", "purple", "orange", "yellow"]),
  systemPrompt: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export const aiChatMessageResponseSchema = z.object({
  id: z.number(),
  aiTeamMemberId: z.number(),
  content: z.string(),
  isUserMessage: z.boolean(),
  timestamp: z.string(),
  noteId: z.number().nullable().optional(),
});

export type CommandResponse = z.infer<typeof commandResponseSchema>;
export type NoteResponse = z.infer<typeof noteResponseSchema>;
export type AiTeamMemberResponse = z.infer<typeof aiTeamMemberResponseSchema>;
export type AiChatMessageResponse = z.infer<typeof aiChatMessageResponseSchema>;
