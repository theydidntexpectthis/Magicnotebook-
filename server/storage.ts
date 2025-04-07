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
  type CommandResponse
} from "@shared/schema";
import * as schema from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Package operations
  getPackages(): Promise<Package[]>;
  getPackage(id: number): Promise<Package | undefined>;
  
  // UserPackage operations
  getUserPackage(userId: number): Promise<UserPackageResponse | undefined>;
  createUserPackage(userPackage: InsertUserPackage): Promise<UserPackage>;
  updateUserPackageTrials(id: number, trialsRemaining: number): Promise<UserPackage>;
  
  // Note operations
  getNoteByUserId(userId: number): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: number, content: string): Promise<Note>;
  
  // Command operations
  executeCommand(command: InsertCommandExecution): Promise<CommandExecution>;
  getCommandsByUserId(userId: number): Promise<CommandExecution[]>;
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
      isActive: userPackage.isActive
    };
  }
  
  async createUserPackage(insertUserPackage: InsertUserPackage): Promise<UserPackage> {
    const [userPackage] = await db.insert(schema.userPackages).values(insertUserPackage).returning();
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
  
  // Note operations
  async getNoteByUserId(userId: number): Promise<Note | undefined> {
    const notes = await db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.userId, userId));
    
    return notes.length ? notes[0] : undefined;
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
  
  // Initialize database with default packages
  async initializePackages(): Promise<void> {
    const existingPackages = await this.getPackages();
    
    if (existingPackages.length === 0) {
      const defaultPackages: InsertPackage[] = [
        {
          name: "Basic",
          price: 999, // $9.99
          trialCount: 3,
          features: ["3 Trial Generations", "Basic Command Support"],
          isBestValue: false,
          icon: "💼"
        },
        {
          name: "Standard",
          price: 1999, // $19.99
          trialCount: 10,
          features: ["10 Trial Generations", "Extended Command Access", "Priority Support"],
          isBestValue: false,
          icon: "🌟"
        },
        {
          name: "Premium",
          price: 4999, // $49.99
          trialCount: 30,
          features: ["30 Trial Generations", "All Command Access", "Premium Services"],
          isBestValue: false,
          icon: "💎"
        },
        {
          name: "Lifetime",
          price: 19900, // $199.00
          trialCount: -1, // Unlimited
          features: ["Unlimited Trial Generations", "All Current & Future Features", "VIP Support"],
          isBestValue: true,
          icon: "♾️"
        }
      ];
      
      for (const pkg of defaultPackages) {
        await this.createPackage(pkg);
      }
    }
  }
}

// Create and initialize the database storage
export const storage = new DatabaseStorage();

// Initialize packages when server starts
(async () => {
  try {
    await storage.initializePackages();
    console.log("Database initialized with default packages");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
})();
