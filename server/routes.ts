import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertNoteSchema, 
  insertCommandExecutionSchema,
  insertAiTeamMemberSchema,
  insertAiChatMessageSchema,
  users
} from "@shared/schema";
import { aiService, initializeAiService } from "./ai-service";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Handle plain text password for development/debugging
  if (!stored.includes(".")) {
    return supplied === stored;
  }
  
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    return false;
  }
  
  try {
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Register all API routes (prefixed with /api)
  
  // Setup authentication
  setupAuth(app);
  
  // Create default demo user if none exists
  const existingUser = await storage.getUserByUsername("demo");
  if (!existingUser) {
    // Create with a secure hashed password
    const hashedPassword = await hashPassword("password");
    
    const newUser = await storage.createUser({
      username: "demo",
      password: hashedPassword,
      email: "demo@example.com",
      createdAt: new Date().toISOString(),
      googleId: null,
      facebookId: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null
    });
    console.log("Created default user with ID:", newUser.id);
  } else {
    console.log("Using existing user with ID:", existingUser.id);
  }
  
  // Create admin user if none exists
  const existingAdmin = await storage.getUserByUsername("admin");
  if (!existingAdmin) {
    // Create with a secure hashed password
    const adminPassword = await hashPassword("adminpassword");
    
    const adminUser = await storage.createUser({
      username: "admin",
      password: adminPassword,
      email: "admin@magicnotebook.com",
      createdAt: new Date().toISOString(),
      googleId: null,
      facebookId: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null
    });
    console.log("Created admin user with ID:", adminUser.id);
  } else {
    // Update the admin password if it exists but might be incorrect
    const adminPassword = await hashPassword("adminpassword");
    try {
      await db.update(users)
        .set({ password: adminPassword })
        .where(eq(users.username, "admin"))
        .execute();
      console.log("Updated admin user password");
    } catch (error) {
      console.error("Error updating admin password:", error);
    }
    console.log("Using existing admin user with ID:", existingAdmin.id);
  }
  
  // Authentication middleware for protecting routes
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ message: "Not authenticated" });
  };

  // Get all packages (public route, no authentication required)
  app.get("/api/packages", async (req: Request, res: Response) => {
    const packages = await storage.getPackages();
    res.json(packages);
  });

  // Get user's active package
  app.get("/api/user/package", isAuthenticated, async (req: Request, res: Response) => {
    const userPackage = await storage.getUserPackage(req.user!.id);
    if (!userPackage) {
      return res.status(404).json({ message: "No active package found" });
    }
    res.json(userPackage);
  });
  
  // Update user profile
  app.patch("/api/user/profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { username, email, currentPassword, newPassword } = req.body;
      
      // Verify current password
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!await comparePasswords(currentPassword, user.password)) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Check if username is taken (if changing)
      if (username !== user.username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ message: "Username is already taken" });
        }
      }
      
      // Update user data
      const updateData: any = {
        username,
        email
      };
      
      // Hash new password if provided
      if (newPassword) {
        updateData.password = await hashPassword(newPassword);
      }
      
      // Update user
      const updatedUser = await db.update(users)
        .set(updateData)
        .where(eq(users.id, req.user!.id))
        .returning();
      
      res.json(updatedUser[0]);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Purchase a package
  app.post("/api/packages/purchase", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Validate package ID
      const packageIdSchema = z.object({ packageId: z.number() });
      const { packageId } = packageIdSchema.parse(req.body);
      
      const pkg = await storage.getPackage(packageId);
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      // Check if user already has an active package
      const existingUserPackage = await storage.getUserPackage(req.user!.id);
      if (existingUserPackage) {
        return res.status(400).json({ message: "User already has an active package" });
      }
      
      // Create new user package
      const userPackage = await storage.createUserPackage({
        userId: req.user!.id,
        packageId,
        purchasedAt: new Date().toISOString(),
        trialsRemaining: pkg.trialCount,
        isActive: true
      });
      
      // Get the package details for the response
      const packageDetails = await storage.getPackage(packageId);
      
      res.status(201).json({
        id: userPackage.id,
        packageId: userPackage.packageId,
        packageName: packageDetails?.name || "Unknown",
        purchasedAt: userPackage.purchasedAt,
        trialsRemaining: userPackage.trialsRemaining,
        isActive: userPackage.isActive
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "An error occurred while purchasing the package" });
    }
  });

  // Get default user's note (legacy endpoint for backward compatibility)
  app.get("/api/notes", isAuthenticated, async (req: Request, res: Response) => {
    const note = await storage.getNoteByUserId(req.user!.id);
    
    if (!note) {
      // Create a default note if none exists
      const defaultNote = await storage.createNote({
        userId: req.user!.id,
        title: "Welcome to Magic Notebook",
        content: "# Welcome to Magic Notebook\n\nStart typing your notes here. Use the formatting options to style your content.\n\nYou can:\n- Take notes with rich formatting\n- Generate trials using commands (with a package)\n- Store all your important ideas in one place\n\nTo use advanced features, select a package below.",
        color: "yellow",
        isPinned: false,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      return res.json(defaultNote);
    }
    
    res.json(note);
  });
  
  // Get all user's notes
  app.get("/api/notes/all", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const notes = await storage.getAllNotesByUserId(req.user!.id);
      
      // If no notes exist, create a default one
      if (notes.length === 0) {
        const defaultNote = await storage.createNote({
          userId: req.user!.id,
          title: "Welcome to Magic Notebook",
          content: "# Welcome to Magic Notebook\n\nStart typing your notes here. Use the formatting options to style your content.\n\nYou can:\n- Take notes with rich formatting\n- Generate trials using commands (with a package)\n- Store all your important ideas in one place\n\nTo use advanced features, select a package below.",
          color: "yellow",
          isPinned: false,
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        return res.json([defaultNote]);
      }
      
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "An error occurred while fetching notes" });
    }
  });

  // Update user's note content
  app.post("/api/notes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const contentSchema = z.object({ content: z.string() });
      const { content } = contentSchema.parse(req.body);
      
      let note = await storage.getNoteByUserId(req.user!.id);
      
      if (!note) {
        // Create new note
        note = await storage.createNote({
          userId: req.user!.id,
          title: "New Note",
          content,
          color: "yellow",
          isPinned: false,
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        // Update existing note
        note = await storage.updateNote(note.id, content);
      }
      
      res.json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "An error occurred while saving the note" });
    }
  });
  
  // Update note properties (title, color, isPinned, isArchived)
  app.patch("/api/notes/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const notePropsSchema = z.object({
        title: z.string().optional(),
        color: z.enum(["yellow", "green", "pink", "blue", "purple", "orange"]).optional(),
        isPinned: z.boolean().optional(),
        isArchived: z.boolean().optional(),
      });
      
      const noteId = parseInt(req.params.id);
      const props = notePropsSchema.parse(req.body);
      
      // Get the note to verify ownership
      const note = await storage.getNoteByUserId(req.user!.id);
      
      if (!note || note.id !== noteId) {
        return res.status(404).json({ message: "Note not found or you don't have permission to edit it" });
      }
      
      // Update the note properties
      const updatedNote = await storage.updateNoteProps(noteId, props);
      
      res.json(updatedNote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "An error occurred while updating the note" });
    }
  });
  
  // Create a new note
  app.post("/api/notes/new", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const newNoteSchema = z.object({
        title: z.string().default("New Note"),
        content: z.string().default(""),
        color: z.enum(["yellow", "green", "pink", "blue", "purple", "orange"]).default("yellow"),
        isPinned: z.boolean().default(false),
        isArchived: z.boolean().default(false),
      });
      
      const noteData = newNoteSchema.parse(req.body);
      
      const note = await storage.createNote({
        userId: req.user!.id,
        ...noteData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "An error occurred while creating the note" });
    }
  });

  // Execute command
  app.post("/api/commands/execute", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const commandSchema = z.object({ command: z.string() });
      const { command } = commandSchema.parse(req.body);
      
      // Check if user has an active package
      const userPackage = await storage.getUserPackage(req.user!.id);
      if (!userPackage) {
        return res.status(403).json({ 
          message: "You need to purchase a package to execute commands"
        });
      }
      
      // Import the trial generation system
      const executeTrialCommand = (await import('./agents')).default;
      
      // Execute the command using our AI agent system
      if (command.match(/^(!)?generateTrial\s+/)) {
        const result = await executeTrialCommand(req.user!.id, command);
        return res.json(result);
      } else {
        // Handle other command types if needed
        const execution = await storage.executeCommand({
          userId: req.user!.id,
          command,
          serviceName: "unknown",
          status: "error",
          message: "Unknown command. Available commands: !generateTrial [serviceName]",
          executedAt: new Date().toISOString()
        });
        
        return res.status(400).json(execution);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      
      console.error("Command execution error:", error);
      res.status(500).json({ 
        message: "An error occurred while executing the command"
      });
    }
  });

  // Get command history
  app.get("/api/commands/history", isAuthenticated, async (req: Request, res: Response) => {
    const commands = await storage.getCommandsByUserId(req.user!.id);
    res.json(commands);
  });
  
  // AI Team Routes
  
  // Initialize AI Team Members for a user
  app.post("/api/ai-team/initialize", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.initializeAiTeamMembersForUser(req.user!.id);
      
      // Get the created team members
      const teamMembers = await storage.getAiTeamMembers(req.user!.id);
      
      res.status(201).json(teamMembers);
    } catch (error) {
      console.error("Error initializing AI team:", error);
      res.status(500).json({ message: "Failed to initialize AI team" });
    }
  });
  
  // Get all AI team members for the current user
  app.get("/api/ai-team/members", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const teamMembers = await storage.getAiTeamMembers(req.user!.id);
      
      // If user has no team members, initialize with defaults
      if (teamMembers.length === 0) {
        await storage.initializeAiTeamMembersForUser(req.user!.id);
        const newTeamMembers = await storage.getAiTeamMembers(req.user!.id);
        return res.json(newTeamMembers);
      }
      
      res.json(teamMembers);
    } catch (error) {
      console.error("Error fetching AI team members:", error);
      res.status(500).json({ message: "Failed to fetch AI team members" });
    }
  });
  
  // Get a specific AI team member
  app.get("/api/ai-team/members/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const memberId = parseInt(req.params.id);
      const member = await storage.getAiTeamMember(memberId);
      
      if (!member || member.userId !== req.user!.id) {
        return res.status(404).json({ message: "AI team member not found" });
      }
      
      res.json(member);
    } catch (error) {
      console.error("Error fetching AI team member:", error);
      res.status(500).json({ message: "Failed to fetch AI team member" });
    }
  });
  
  // Create a new AI team member
  app.post("/api/ai-team/members", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const newMemberSchema = insertAiTeamMemberSchema.extend({
        avatarColor: z.enum(["blue", "green", "pink", "purple", "orange", "yellow"]).default("blue")
      });
      
      const memberData = newMemberSchema.parse({
        ...req.body,
        userId: req.user!.id,
        createdAt: new Date().toISOString(),
        isActive: true
      });
      
      const newMember = await storage.createAiTeamMember(memberData);
      
      res.status(201).json(newMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Error creating AI team member:", error);
      res.status(500).json({ message: "Failed to create AI team member" });
    }
  });
  
  // Update an AI team member
  app.patch("/api/ai-team/members/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const memberId = parseInt(req.params.id);
      const member = await storage.getAiTeamMember(memberId);
      
      if (!member || member.userId !== req.user!.id) {
        return res.status(404).json({ message: "AI team member not found" });
      }
      
      const updateSchema = z.object({
        name: z.string().optional(),
        role: z.string().optional(),
        model: z.string().optional(),
        provider: z.string().optional(),
        avatarColor: z.enum(["blue", "green", "pink", "purple", "orange", "yellow"]).optional(),
        systemPrompt: z.string().optional(),
        isActive: z.boolean().optional()
      });
      
      const updates = updateSchema.parse(req.body);
      
      const updatedMember = await storage.updateAiTeamMember(memberId, updates);
      
      res.json(updatedMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Error updating AI team member:", error);
      res.status(500).json({ message: "Failed to update AI team member" });
    }
  });
  
  // Delete an AI team member
  app.delete("/api/ai-team/members/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const memberId = parseInt(req.params.id);
      const member = await storage.getAiTeamMember(memberId);
      
      if (!member || member.userId !== req.user!.id) {
        return res.status(404).json({ message: "AI team member not found" });
      }
      
      const success = await storage.deleteAiTeamMember(memberId);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete AI team member" });
      }
    } catch (error) {
      console.error("Error deleting AI team member:", error);
      res.status(500).json({ message: "Failed to delete AI team member" });
    }
  });
  
  // Get chat history for an AI team member
  app.get("/api/ai-team/chat/:memberId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const member = await storage.getAiTeamMember(memberId);
      
      if (!member || member.userId !== req.user!.id) {
        return res.status(404).json({ message: "AI team member not found" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const messages = await storage.getAiChatMessages(memberId, limit);
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });
  
  // Send a message to an AI team member
  app.post("/api/ai-team/chat/:memberId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const member = await storage.getAiTeamMember(memberId);
      
      if (!member || member.userId !== req.user!.id) {
        return res.status(404).json({ message: "AI team member not found" });
      }
      
      const messageSchema = z.object({
        content: z.string(),
        noteId: z.number().optional()
      });
      
      const { content, noteId } = messageSchema.parse(req.body);
      
      // Save user message
      const userMessage = await storage.createAiChatMessage({
        userId: req.user!.id,
        aiTeamMemberId: memberId,
        content,
        isUserMessage: true,
        timestamp: new Date().toISOString(),
        noteId
      });
      
      // Get recent chat history (last 10 messages)
      const recentMessages = await storage.getAiChatMessages(memberId, 10);
      const chatHistory = recentMessages.reverse().map(msg => ({
        content: msg.content,
        isUserMessage: msg.isUserMessage
      }));
      
      // Generate AI response using our service
      // For now, we'll use mock responses since we may not have API keys
      try {
        const aiResponse = await aiService.generateResponse(member, content, chatHistory);
        
        // Save AI response
        const botMessage = await storage.createAiChatMessage({
          userId: req.user!.id,
          aiTeamMemberId: memberId,
          content: aiResponse,
          isUserMessage: false,
          timestamp: new Date().toISOString(),
          noteId
        });
        
        // Return both messages
        res.json({
          userMessage,
          botMessage
        });
      } catch (error) {
        console.error("Error generating AI response:", error);
        
        // If AI generation fails, still save a fallback message
        const errorMessage = await storage.createAiChatMessage({
          userId: req.user!.id,
          aiTeamMemberId: memberId,
          content: "I'm sorry, I encountered an error processing your message. Please try again later.",
          isUserMessage: false,
          timestamp: new Date().toISOString(),
          noteId
        });
        
        res.status(500).json({
          userMessage,
          botMessage: errorMessage,
          error: "Failed to generate AI response"
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Error sending message to AI team member:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  
  // Clear chat history for an AI team member
  app.delete("/api/ai-team/chat/:memberId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const member = await storage.getAiTeamMember(memberId);
      
      if (!member || member.userId !== req.user!.id) {
        return res.status(404).json({ message: "AI team member not found" });
      }
      
      const success = await storage.deleteAiChatHistory(memberId);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to clear chat history" });
      }
    } catch (error) {
      console.error("Error clearing chat history:", error);
      res.status(500).json({ message: "Failed to clear chat history" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
