import { 
  users, 
  packages, 
  userPackages, 
  notes, 
  commandExecutions,
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private packages: Map<number, Package>;
  private userPackages: Map<number, UserPackage>;
  private notes: Map<number, Note>;
  private commandExecutions: Map<number, CommandExecution>;
  
  private userIdCounter: number;
  private packageIdCounter: number;
  private userPackageIdCounter: number;
  private noteIdCounter: number;
  private commandIdCounter: number;

  constructor() {
    this.users = new Map();
    this.packages = new Map();
    this.userPackages = new Map();
    this.notes = new Map();
    this.commandExecutions = new Map();
    
    this.userIdCounter = 1;
    this.packageIdCounter = 1;
    this.userPackageIdCounter = 1;
    this.noteIdCounter = 1;
    this.commandIdCounter = 1;
    
    // Initialize with default packages
    this.initializePackages();
  }

  private initializePackages() {
    const defaultPackages: InsertPackage[] = [
      {
        name: "Basic",
        price: 999, // $9.99
        trialCount: 3,
        features: ["3 Trial Generations", "Basic Command Support"],
        isBestValue: false,
        icon: "rocket"
      },
      {
        name: "Standard",
        price: 1999, // $19.99
        trialCount: 10,
        features: ["10 Trial Generations", "Extended Command Access", "Priority Support"],
        isBestValue: false,
        icon: "gem"
      },
      {
        name: "Premium",
        price: 4999, // $49.99
        trialCount: 30,
        features: ["30 Trial Generations", "All Command Access", "Premium Services"],
        isBestValue: false,
        icon: "crown"
      },
      {
        name: "Lifetime",
        price: 19900, // $199.00
        trialCount: -1, // Unlimited
        features: ["Unlimited Trial Generations", "All Current & Future Features", "VIP Support"],
        isBestValue: true,
        icon: "infinity"
      }
    ];
    
    defaultPackages.forEach(pkg => this.createPackage(pkg));
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Package operations
  async getPackages(): Promise<Package[]> {
    return Array.from(this.packages.values());
  }
  
  async getPackage(id: number): Promise<Package | undefined> {
    return this.packages.get(id);
  }
  
  async createPackage(insertPackage: InsertPackage): Promise<Package> {
    const id = this.packageIdCounter++;
    const pkg: Package = { ...insertPackage, id };
    this.packages.set(id, pkg);
    return pkg;
  }
  
  // UserPackage operations
  async getUserPackage(userId: number): Promise<UserPackageResponse | undefined> {
    const userPackage = Array.from(this.userPackages.values()).find(
      (up) => up.userId === userId && up.isActive
    );
    
    if (!userPackage) return undefined;
    
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
    const id = this.userPackageIdCounter++;
    const userPackage: UserPackage = { ...insertUserPackage, id };
    this.userPackages.set(id, userPackage);
    return userPackage;
  }
  
  async updateUserPackageTrials(id: number, trialsRemaining: number): Promise<UserPackage> {
    const userPackage = this.userPackages.get(id);
    if (!userPackage) {
      throw new Error('User package not found');
    }
    
    const updatedUserPackage = { ...userPackage, trialsRemaining };
    this.userPackages.set(id, updatedUserPackage);
    return updatedUserPackage;
  }
  
  // Note operations
  async getNoteByUserId(userId: number): Promise<Note | undefined> {
    return Array.from(this.notes.values()).find(
      (note) => note.userId === userId
    );
  }
  
  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = this.noteIdCounter++;
    const note: Note = { ...insertNote, id };
    this.notes.set(id, note);
    return note;
  }
  
  async updateNote(id: number, content: string): Promise<Note> {
    const note = this.notes.get(id);
    if (!note) {
      throw new Error('Note not found');
    }
    
    const updatedNote = { 
      ...note, 
      content,
      updatedAt: new Date().toISOString()
    };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }
  
  // Command operations
  async executeCommand(insertCommand: InsertCommandExecution): Promise<CommandExecution> {
    const id = this.commandIdCounter++;
    const command: CommandExecution = { ...insertCommand, id };
    this.commandExecutions.set(id, command);
    return command;
  }
  
  async getCommandsByUserId(userId: number): Promise<CommandExecution[]> {
    return Array.from(this.commandExecutions.values()).filter(
      (cmd) => cmd.userId === userId
    ).sort((a, b) => 
      new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
    );
  }
}

export const storage = new MemStorage();
