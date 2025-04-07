import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertUserPackageSchema, 
  insertNoteSchema, 
  insertCommandExecutionSchema
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register all API routes (prefixed with /api)
  
  // Mock authentication for demo purposes
  let currentUserId = 1;

  // Create a default user if none exists
  const existingUser = await storage.getUserByUsername("demo");
  if (!existingUser) {
    await storage.createUser({
      username: "demo",
      password: "password"
    });
  }

  // Get current user
  app.get("/api/user", async (req: Request, res: Response) => {
    const user = await storage.getUser(currentUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Don't return the password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // Get all packages
  app.get("/api/packages", async (req: Request, res: Response) => {
    const packages = await storage.getPackages();
    res.json(packages);
  });

  // Get user's active package
  app.get("/api/user/package", async (req: Request, res: Response) => {
    const userPackage = await storage.getUserPackage(currentUserId);
    if (!userPackage) {
      return res.status(404).json({ message: "No active package found" });
    }
    res.json(userPackage);
  });

  // Purchase a package
  app.post("/api/packages/purchase", async (req: Request, res: Response) => {
    try {
      // Validate package ID
      const packageIdSchema = z.object({ packageId: z.number() });
      const { packageId } = packageIdSchema.parse(req.body);
      
      const pkg = await storage.getPackage(packageId);
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      // Check if user already has an active package
      const existingUserPackage = await storage.getUserPackage(currentUserId);
      if (existingUserPackage) {
        return res.status(400).json({ message: "User already has an active package" });
      }
      
      // Create new user package
      const userPackage = await storage.createUserPackage({
        userId: currentUserId,
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

  // Get user's note
  app.get("/api/notes", async (req: Request, res: Response) => {
    const note = await storage.getNoteByUserId(currentUserId);
    
    if (!note) {
      // Create a default note if none exists
      const defaultNote = await storage.createNote({
        userId: currentUserId,
        content: "# Welcome to Magic Notebook\n\nStart typing your notes here. Use the formatting options to style your content.\n\nYou can:\n- Take notes with rich formatting\n- Generate trials using commands (with a package)\n- Store all your important ideas in one place\n\nTo use advanced features, select a package below.",
        updatedAt: new Date().toISOString()
      });
      
      return res.json(defaultNote);
    }
    
    res.json(note);
  });

  // Update user's note
  app.post("/api/notes", async (req: Request, res: Response) => {
    try {
      const contentSchema = z.object({ content: z.string() });
      const { content } = contentSchema.parse(req.body);
      
      let note = await storage.getNoteByUserId(currentUserId);
      
      if (!note) {
        // Create new note
        note = await storage.createNote({
          userId: currentUserId,
          content,
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

  // Execute command
  app.post("/api/commands/execute", async (req: Request, res: Response) => {
    try {
      const commandSchema = z.object({ command: z.string() });
      const { command } = commandSchema.parse(req.body);
      
      // Check if user has an active package
      const userPackage = await storage.getUserPackage(currentUserId);
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
          userId: currentUserId,
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
          userId: currentUserId,
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
        userId: currentUserId,
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
  app.get("/api/commands/history", async (req: Request, res: Response) => {
    const commands = await storage.getCommandsByUserId(currentUserId);
    res.json(commands);
  });

  const httpServer = createServer(app);

  return httpServer;
}
