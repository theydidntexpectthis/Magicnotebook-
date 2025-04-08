import { 
  type User, 
  type InsertUser, 
  type Package, 
  type InsertPackage, 
  type UserPackage, 
  type InsertUserPackage, 
  type Note, 
  type InsertNote, 
  type CommandExecution, 
  type InsertCommandExecution,
  type PackageResponse,
  type UserPackageResponse,
  type CommandResponse,
  type AiTeamMember,
  type InsertAiTeamMember,
  type AiChatMessage,
  type InsertAiChatMessage,
  type AiTeamMemberResponse,
  type AiChatMessageResponse
} from "@shared/schema";
import * as schema from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByFacebookId(facebookId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Package operations
  getPackages(): Promise<Package[]>;
  getPackage(id: number): Promise<Package | undefined>;
  
  // UserPackage operations
  getUserPackage(userId: number): Promise<UserPackageResponse | undefined>;
  createUserPackage(userPackage: InsertUserPackage): Promise<UserPackage>;
  updateUserPackageTrials(id: number, trialsRemaining: number): Promise<UserPackage>;
  incrementTrialsUsedInCycle(id: number): Promise<UserPackage>;
  resetTrialsUsedInCycle(id: number): Promise<UserPackage>;
  updateUserPackageTransaction(id: number, transactionId: string): Promise<UserPackage>;
  
  // Note operations
  getNoteByUserId(userId: number): Promise<Note | undefined>;
  getAllNotesByUserId(userId: number): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: number, content: string): Promise<Note>;
  updateNoteProps(id: number, props: Partial<Omit<InsertNote, 'userId'>>): Promise<Note>;
  
  // Command operations
  executeCommand(command: InsertCommandExecution): Promise<CommandExecution>;
  getCommandsByUserId(userId: number): Promise<CommandExecution[]>;
  
  // AI Team operations
  getAiTeamMembers(userId: number): Promise<AiTeamMember[]>;
  getAiTeamMember(id: number): Promise<AiTeamMember | undefined>;
  createAiTeamMember(member: InsertAiTeamMember): Promise<AiTeamMember>;
  updateAiTeamMember(id: number, props: Partial<Omit<InsertAiTeamMember, 'userId' | 'createdAt'>>): Promise<AiTeamMember>;
  deleteAiTeamMember(id: number): Promise<boolean>;
  
  // AI Chat operations
  getAiChatMessages(aiTeamMemberId: number, limit?: number): Promise<AiChatMessage[]>;
  getAiChatMessagesForNote(noteId: number): Promise<AiChatMessage[]>;
  createAiChatMessage(message: InsertAiChatMessage): Promise<AiChatMessage>;
  deleteAiChatHistory(aiTeamMemberId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return users.length ? users[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return users.length ? users[0] : undefined;
  }
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.googleId, googleId));
    return users.length ? users[0] : undefined;
  }
  
  async getUserByFacebookId(facebookId: string): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.facebookId, facebookId));
    return users.length ? users[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    return user;
  }
  
  // Package operations
  async getPackages(): Promise<Package[]> {
    return await db.select().from(schema.packages);
  }
  
  async getPackage(id: number): Promise<Package | undefined> {
    const packages = await db.select().from(schema.packages).where(eq(schema.packages.id, id));
    return packages.length ? packages[0] : undefined;
  }
  
  async createPackage(insertPackage: InsertPackage): Promise<Package> {
    const [pkg] = await db.insert(schema.packages).values(insertPackage).returning();
    return pkg;
  }
  
  // UserPackage operations
  async getUserPackage(userId: number): Promise<UserPackageResponse | undefined> {
    const userPackages = await db
      .select()
      .from(schema.userPackages)
      .where(
        and(
          eq(schema.userPackages.userId, userId),
          eq(schema.userPackages.isActive, true)
        )
      );
    
    if (!userPackages.length) return undefined;
    
    const userPackage = userPackages[0];
    const pkg = await this.getPackage(userPackage.packageId);
    if (!pkg) return undefined;
    
    return {
      id: userPackage.id,
      packageId: userPackage.packageId,
      packageName: pkg.name,
      purchasedAt: userPackage.purchasedAt,
      trialsRemaining: userPackage.trialsRemaining,
      isActive: userPackage.isActive ?? true,
      isSubscription: userPackage.isSubscription,
      renewalDate: userPackage.renewalDate,
      trialLimitPerCycle: userPackage.trialLimitPerCycle,
      trialsUsedInCycle: userPackage.trialsUsedInCycle
    };
  }
  
  async createUserPackage(insertUserPackage: InsertUserPackage): Promise<UserPackage> {
    // Determine if this is a subscription package based on the name
    const pkg = await this.getPackage(insertUserPackage.packageId);
    if (pkg) {
      const isSubscription = pkg.name.includes('Monthly');
      
      // If this is a subscription package, set up the renewal date and limits
      if (isSubscription) {
        const purchaseDate = new Date(insertUserPackage.purchasedAt);
        const renewalDate = new Date(purchaseDate);
        renewalDate.setMonth(renewalDate.getMonth() + 1);
        
        // Set different limits based on package tier
        const trialLimitPerCycle = pkg.name.includes('Premium') ? 30 : 15;
        
        // Add subscription-specific fields
        const subscriptionPackage = {
          ...insertUserPackage,
          isSubscription: true,
          renewalDate: renewalDate.toISOString(),
          trialLimitPerCycle,
          trialsUsedInCycle: 0
        };
        
        const [userPackage] = await db.insert(schema.userPackages).values(subscriptionPackage).returning();
        return userPackage;
      }
    }
    
    // For non-subscription packages
    const [userPackage] = await db.insert(schema.userPackages).values({
      ...insertUserPackage,
      isSubscription: false
    }).returning();
    return userPackage;
  }
  
  async updateUserPackageTrials(id: number, trialsRemaining: number): Promise<UserPackage> {
    const [updatedUserPackage] = await db
      .update(schema.userPackages)
      .set({ trialsRemaining })
      .where(eq(schema.userPackages.id, id))
      .returning();
    
    if (!updatedUserPackage) {
      throw new Error('User package not found');
    }
    
    return updatedUserPackage;
  }
  
  async incrementTrialsUsedInCycle(id: number): Promise<UserPackage> {
    // Get the current user package
    const [userPackage] = await db
      .select()
      .from(schema.userPackages)
      .where(eq(schema.userPackages.id, id));
    
    if (!userPackage) {
      throw new Error('User package not found');
    }
    
    // Only increment for subscription packages
    if (userPackage.isSubscription) {
      const trialsUsedInCycle = (userPackage.trialsUsedInCycle || 0) + 1;
      
      const [updatedUserPackage] = await db
        .update(schema.userPackages)
        .set({ trialsUsedInCycle })
        .where(eq(schema.userPackages.id, id))
        .returning();
        
      return updatedUserPackage;
    }
    
    return userPackage;
  }
  
  async resetTrialsUsedInCycle(id: number): Promise<UserPackage> {
    const [updatedUserPackage] = await db
      .update(schema.userPackages)
      .set({ 
        trialsUsedInCycle: 0,
        // Update renewal date to next month
        renewalDate: (() => {
          const now = new Date();
          const nextMonth = new Date(now);
          nextMonth.setMonth(now.getMonth() + 1);
          return nextMonth.toISOString();
        })()
      })
      .where(eq(schema.userPackages.id, id))
      .returning();
    
    if (!updatedUserPackage) {
      throw new Error('User package not found');
    }
    
    return updatedUserPackage;
  }
  
  async updateUserPackageTransaction(id: number, transactionId: string): Promise<UserPackage> {
    const [updatedUserPackage] = await db
      .update(schema.userPackages)
      .set({ transactionId })
      .where(eq(schema.userPackages.id, id))
      .returning();
    
    if (!updatedUserPackage) {
      throw new Error('User package not found');
    }
    
    return updatedUserPackage;
  }
  
  // Note operations
  async getNoteByUserId(userId: number): Promise<Note | undefined> {
    const notes = await db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.userId, userId))
      .limit(1);
    
    return notes.length ? notes[0] : undefined;
  }
  
  async getAllNotesByUserId(userId: number): Promise<Note[]> {
    return await db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.userId, userId))
      .orderBy(desc(schema.notes.isPinned), desc(schema.notes.updatedAt));
  }
  
  async createNote(insertNote: InsertNote): Promise<Note> {
    const [note] = await db.insert(schema.notes).values(insertNote).returning();
    return note;
  }
  
  async updateNote(id: number, content: string): Promise<Note> {
    const [updatedNote] = await db
      .update(schema.notes)
      .set({ 
        content,
        updatedAt: new Date().toISOString()
      })
      .where(eq(schema.notes.id, id))
      .returning();
    
    if (!updatedNote) {
      throw new Error('Note not found');
    }
    
    return updatedNote;
  }
  
  async updateNoteProps(id: number, props: Partial<Omit<InsertNote, 'userId'>>): Promise<Note> {
    // Always include the updated timestamp when updating note properties
    const updateData = {
      ...props,
      updatedAt: new Date().toISOString()
    };
    
    const [updatedNote] = await db
      .update(schema.notes)
      .set(updateData)
      .where(eq(schema.notes.id, id))
      .returning();
    
    if (!updatedNote) {
      throw new Error('Note not found');
    }
    
    return updatedNote;
  }
  
  // Command operations
  async executeCommand(insertCommand: InsertCommandExecution): Promise<CommandExecution> {
    const [command] = await db.insert(schema.commandExecutions).values(insertCommand).returning();
    return command;
  }
  
  async getCommandsByUserId(userId: number): Promise<CommandExecution[]> {
    return await db
      .select()
      .from(schema.commandExecutions)
      .where(eq(schema.commandExecutions.userId, userId))
      .orderBy(desc(schema.commandExecutions.executedAt));
  }
  
  // AI Team operations
  async getAiTeamMembers(userId: number): Promise<AiTeamMember[]> {
    return await db
      .select()
      .from(schema.aiTeamMembers)
      .where(eq(schema.aiTeamMembers.userId, userId))
      .orderBy(desc(schema.aiTeamMembers.isActive), desc(schema.aiTeamMembers.createdAt));
  }
  
  async getAiTeamMember(id: number): Promise<AiTeamMember | undefined> {
    const members = await db.select().from(schema.aiTeamMembers).where(eq(schema.aiTeamMembers.id, id));
    return members.length ? members[0] : undefined;
  }
  
  async createAiTeamMember(insertMember: InsertAiTeamMember): Promise<AiTeamMember> {
    const [member] = await db.insert(schema.aiTeamMembers).values(insertMember).returning();
    return member;
  }
  
  async updateAiTeamMember(
    id: number, 
    props: Partial<Omit<InsertAiTeamMember, 'userId' | 'createdAt'>>
  ): Promise<AiTeamMember> {
    const [updatedMember] = await db
      .update(schema.aiTeamMembers)
      .set(props)
      .where(eq(schema.aiTeamMembers.id, id))
      .returning();
    
    if (!updatedMember) {
      throw new Error('AI team member not found');
    }
    
    return updatedMember;
  }
  
  async deleteAiTeamMember(id: number): Promise<boolean> {
    const result = await db
      .delete(schema.aiTeamMembers)
      .where(eq(schema.aiTeamMembers.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  // AI Chat operations
  async getAiChatMessages(aiTeamMemberId: number, limit?: number): Promise<AiChatMessage[]> {
    // If a limit is specified, include it in the query
    if (limit !== undefined) {
      return await db
        .select()
        .from(schema.aiChatMessages)
        .where(eq(schema.aiChatMessages.aiTeamMemberId, aiTeamMemberId))
        .orderBy(desc(schema.aiChatMessages.timestamp))
        .limit(limit);
    }
    
    // Otherwise, just return all messages
    return await db
      .select()
      .from(schema.aiChatMessages)
      .where(eq(schema.aiChatMessages.aiTeamMemberId, aiTeamMemberId))
      .orderBy(desc(schema.aiChatMessages.timestamp));
  }
  
  async getAiChatMessagesForNote(noteId: number): Promise<AiChatMessage[]> {
    return await db
      .select()
      .from(schema.aiChatMessages)
      .where(eq(schema.aiChatMessages.noteId, noteId))
      .orderBy(desc(schema.aiChatMessages.timestamp));
  }
  
  async createAiChatMessage(insertMessage: InsertAiChatMessage): Promise<AiChatMessage> {
    const [message] = await db.insert(schema.aiChatMessages).values(insertMessage).returning();
    return message;
  }
  
  async deleteAiChatHistory(aiTeamMemberId: number): Promise<boolean> {
    const result = await db
      .delete(schema.aiChatMessages)
      .where(eq(schema.aiChatMessages.aiTeamMemberId, aiTeamMemberId))
      .returning();
    
    return result.length > 0;
  }
  
  // Initialize database with default packages
  async initializePackages(): Promise<void> {
    const existingPackages = await this.getPackages();
    
    if (existingPackages.length === 0) {
      const defaultPackages: InsertPackage[] = [
        {
          name: "Single Trial",
          price: 99, // $0.99
          trialCount: 1,
          features: ["1 Trial Generation", "One-time Purchase", "Try Before You Subscribe"],
          isBestValue: false,
          icon: "rocket"
        },
        {
          name: "Monthly Basic",
          price: 1500, // $15.00/month
          trialCount: -1, // Unlimited for month
          features: ["Unlimited Monthly Trials", "All Command Access", "Cancel Anytime"],
          isBestValue: false,
          icon: "gem"
        },
        {
          name: "Monthly Premium",
          price: 3000, // $30.00/month
          trialCount: -1, // Unlimited for month
          features: ["Unlimited Monthly Trials", "Premium Features", "Priority Support", "Premium Commands"],
          isBestValue: true,
          icon: "crown"
        },
        {
          name: "Lifetime",
          price: 19900, // $199.00
          trialCount: -1, // Unlimited forever
          features: ["Unlimited Lifetime Trials", "All Current & Future Features", "VIP Support", "Ultimate Freedom"],
          isBestValue: false,
          icon: "infinity"
        }
      ];
      
      for (const pkg of defaultPackages) {
        await this.createPackage(pkg);
      }
    }
  }
  
  // Initialize default AI team members for a user
  async initializeAiTeamMembersForUser(userId: number): Promise<void> {
    const existingMembers = await this.getAiTeamMembers(userId);
    
    if (existingMembers.length === 0) {
      const now = new Date().toISOString();
      
      const defaultTeamMembers: InsertAiTeamMember[] = [
        {
          userId,
          name: "Claude",
          role: "Creative Assistant",
          model: "claude-3-7-sonnet-20250219", // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
          provider: "anthropic",
          avatarColor: "blue",
          systemPrompt: "You are Claude, a creative and imaginative AI assistant. You excel at generating creative ideas, stories, and content. Be enthusiastic, encouraging, and think outside the box.",
          isActive: true,
          createdAt: now
        },
        {
          userId,
          name: "GPT",
          role: "Technical Expert",
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
          provider: "openai",
          avatarColor: "green",
          systemPrompt: "You are GPT, a technical AI assistant with expertise in programming, data analysis, and problem-solving. Provide clear, accurate, and concise information with a focus on technical accuracy.",
          isActive: true,
          createdAt: now
        },
        {
          userId,
          name: "Sage",
          role: "Research Analyst",
          model: "claude-3-7-sonnet-20250219",
          provider: "anthropic",
          avatarColor: "purple",
          systemPrompt: "You are Sage, a research-focused AI assistant with a methodical approach to gathering and analyzing information. Provide comprehensive, well-sourced answers with a balanced perspective on complex topics.",
          isActive: true,
          createdAt: now
        }
      ];
      
      for (const member of defaultTeamMembers) {
        await this.createAiTeamMember(member);
      }
    }
  }
}

// Create and initialize the database storage
export const storage = new DatabaseStorage();

// Initialize database when server starts
(async () => {
  try {
    await storage.initializePackages();
    console.log("Database initialized with default packages");
    
    // We don't have a list of users here, so we'll skip AI team initialization
    // The initializeAiTeamMembersForUser function will be called when users log in
  } catch (error) {
    console.error("Error initializing database:", error);
  }
})();
