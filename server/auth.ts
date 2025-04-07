import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, registerUserSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  console.log("Comparing passwords:", { supplied, storedLength: stored?.length });
  
  // Handle plain text password for development/debugging
  if (!stored.includes(".")) {
    console.log("Using plain text password comparison (development only)");
    return supplied === stored;
  }
  
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    console.log("Invalid stored password format (missing parts)");
    return false;
  }
  
  console.log("Hashed part length:", hashed.length);
  console.log("Salt part:", salt);
  
  try {
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    const result = timingSafeEqual(hashedBuf, suppliedBuf);
    console.log("Password comparison result:", result);
    return result;
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "magic-notebook-secret",
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      pool,
      tableName: "session",
      createTableIfMissing: true
    }),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for username/password login
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        const isValidPassword = await comparePasswords(password, user.password);
        
        if (!isValidPassword) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );
  
  // Google OAuth strategy
  passport.use(
    new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID || "mock-google-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-google-client-secret",
      callbackURL: "/api/auth/google/callback",
      scope: ["profile", "email"]
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with this googleId
        let user = await storage.getUserByGoogleId(profile.id);
        
        if (user) {
          return done(null, user);
        }
        
        // User doesn't exist, create a new one
        const username = `google_${profile.id.substring(0, 8)}`;
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        
        // Generate a random password for this user
        const password = await hashPassword(randomBytes(16).toString('hex'));
        
        // Create new user
        user = await storage.createUser({
          username,
          password,
          email,
          googleId: profile.id,
          createdAt: new Date().toISOString(),
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          facebookId: null
        });
        
        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    })
  );
  
  // Facebook OAuth strategy
  passport.use(
    new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID || "mock-facebook-app-id",
      clientSecret: process.env.FACEBOOK_APP_SECRET || "mock-facebook-app-secret",
      callbackURL: "/api/auth/facebook/callback",
      profileFields: ['id', 'displayName', 'photos', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with this facebookId
        let user = await storage.getUserByFacebookId(profile.id);
        
        if (user) {
          return done(null, user);
        }
        
        // User doesn't exist, create a new one
        const username = `facebook_${profile.id.substring(0, 8)}`;
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        
        // Generate a random password for this user
        const password = await hashPassword(randomBytes(16).toString('hex'));
        
        // Create new user
        user = await storage.createUser({
          username,
          password,
          email,
          facebookId: profile.id,
          createdAt: new Date().toISOString(),
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          googleId: null
        });
        
        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Register a new user
  app.post("/api/register", async (req, res) => {
    try {
      const validationSchema = registerUserSchema.superRefine(({password, confirmPassword}: { password: string, confirmPassword: string }, ctx: z.RefinementCtx) => {
        if (password !== confirmPassword) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Passwords do not match",
            path: ["confirmPassword"]
          });
        }
      });
      
      const userData = validationSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Create the user with a hashed password
      const hashedPassword = await hashPassword(userData.password);
      
      const newUser = await storage.createUser({
        username: userData.username,
        password: hashedPassword,
        email: userData.email || null,
        createdAt: new Date().toISOString(),
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        googleId: null,
        facebookId: null
      });
      
      // Don't return the password
      const { password, ...userWithoutPassword } = newUser;
      
      // Automatically log in the new user
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging in after registration" });
        }
        
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message, errors: error.format() });
      }
      
      console.error("Error creating user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // User login
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info?: { message: string }) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        
        // Don't return the password
        const { password, ...userWithoutPassword } = user;
        
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // User logout
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error during logout" });
      }
      
      res.status(200).json({ message: "Successfully logged out" });
    });
  });

  // Google OAuth routes
  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  
  app.get("/api/auth/google/callback", 
    passport.authenticate("google", { failureRedirect: "/auth" }),
    (req, res) => {
      // Successful authentication, redirect to app
      res.redirect("/app");
    }
  );
  
  // Facebook OAuth routes
  app.get("/api/auth/facebook", passport.authenticate("facebook", { scope: ["email"] }));
  
  app.get("/api/auth/facebook/callback",
    passport.authenticate("facebook", { failureRedirect: "/auth" }),
    (req, res) => {
      // Successful authentication, redirect to app
      res.redirect("/app");
    }
  );
  
  // Get current user information
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Don't return the password
    const { password, ...userWithoutPassword } = req.user;
    
    res.json(userWithoutPassword);
  });
}