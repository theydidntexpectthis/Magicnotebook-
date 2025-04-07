import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertNoteSchema, 
  insertCommandExecutionSchema
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Register all API routes (prefixed with /api)
  
  // Setup authentication
  setupAuth(app);
  
  // Create a default user if none exists
  const existingUser = await storage.getUserByUsername("demo");
  if (!existingUser) {
    // Create with a secure hashed password
    const hashedPassword = await hashPassword("password");
    
    const newUser = await storage.createUser({
      username: "demo",
      password: hashedPassword,
      email: "demo@example.com",
      createdAt: new Date().toISOString()
    });
    console.log("Created default user with ID:", newUser.id);
  } else {
    console.log("Using existing user with ID:", existingUser.id);
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
      
      // Parse command
      const commandRegex = /^(!)?generateTrial\s+([a-zA-Z0-9]+)$/;
      const match = command.match(commandRegex);
      
      if (!match) {
        const execution = await storage.executeCommand({
          userId: req.user!.id,
          command,
          serviceName: "unknown",
          status: "error",
          message: "Invalid command format. Use: !generateTrial [serviceName]",
          executedAt: new Date().toISOString()
        });
        
        return res.status(400).json(execution);
      }
      
      const serviceName = match[2];
      
      // Check if user has trials remaining (unless unlimited)
      if (userPackage.trialsRemaining === 0) {
        const execution = await storage.executeCommand({
          userId: req.user!.id,
          command,
          serviceName,
          status: "error",
          message: "You have no trials remaining. Please upgrade your package.",
          executedAt: new Date().toISOString()
        });
        
        return res.status(403).json(execution);
      }
      
      // If user has unlimited trials (indicated by -1)
      const isUnlimited = userPackage.trialsRemaining === -1;
      
      // Process the command (mock the trial generation)
      // In a real app, this would call external APIs
      const execution = await storage.executeCommand({
        userId: req.user!.id,
        command,
        serviceName,
        status: "success",
        message: `Trial for ${serviceName} generated successfully! Check your email for details.`,
        executedAt: new Date().toISOString()
      });
      
      // Update trials remaining if not unlimited
      if (!isUnlimited) {
        await storage.updateUserPackageTrials(
          userPackage.id, 
          userPackage.trialsRemaining - 1
        );
      }
      
      res.json(execution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      
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

  const httpServer = createServer(app);

  return httpServer;
}
