import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StickyNote } from "@/components/ui/sticky-note";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

// Form validation schemas
const loginSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }).optional().nullable(),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

const AuthPage: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    }
  });

  // Register form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    }
  });

  const { user, isLoading: authLoading, login, register, error: authError } = useAuth();

  const handleLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data);
      setLocation("/app");
    } catch (error) {
      // Error is handled by the useAuth hook
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await register(data);
      setLocation("/app");
    } catch (error) {
      // Error is handled by the useAuth hook
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    if (user) {
      setLocation("/app");
    }
  }, [user, setLocation]);

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex flex-col md:flex-row w-full max-w-7xl mx-auto overflow-hidden">
        {/* Left side - Auth form */}
        <div className="w-full md:w-1/2 p-6 flex items-center justify-center">
          <div className="w-full max-w-md space-y-4">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Magic Notebook</h1>
              <p className="text-gray-600 mt-2">
                {isLoginMode ? "Welcome back! Sign in to continue" : "Create an account to get started"}
              </p>
            </div>
            
            <StickyNote color={isLoginMode ? "yellow" : "green"} className="p-6 transform rotate-1">
              {isLoginMode ? (
                <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
                  <h2 className="text-xl font-semibold text-center mb-4">Sign In</h2>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Username</Label>
                    <Input 
                      id="login-username"
                      {...loginForm.register("username")}
                      className="bg-white/80"
                      placeholder="Your username"
                    />
                    {loginForm.formState.errors.username && (
                      <p className="text-sm text-red-500">{loginForm.formState.errors.username.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input 
                      id="login-password"
                      type="password"
                      {...loginForm.register("password")}
                      className="bg-white/80"
                      placeholder="Your password"
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Sign In
                  </Button>
                </form>
              ) : (
                <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-4">
                  <h2 className="text-xl font-semibold text-center mb-4">Create Account</h2>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-username">Username</Label>
                    <Input 
                      id="register-username"
                      {...registerForm.register("username")}
                      className="bg-white/80"
                      placeholder="Choose a username"
                    />
                    {registerForm.formState.errors.username && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.username.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email (Optional)</Label>
                    <Input 
                      id="register-email"
                      type="email"
                      {...registerForm.register("email")}
                      className="bg-white/80"
                      placeholder="Your email address"
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input 
                      id="register-password"
                      type="password"
                      {...registerForm.register("password")}
                      className="bg-white/80"
                      placeholder="Create a password"
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirm Password</Label>
                    <Input 
                      id="register-confirm-password"
                      type="password"
                      {...registerForm.register("confirmPassword")}
                      className="bg-white/80"
                      placeholder="Confirm your password"
                    />
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-lime-500 hover:bg-lime-600"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Account
                  </Button>
                </form>
              )}
            </StickyNote>
            
            <StickyNote color="blue" className="p-4 text-center transform -rotate-1">
              <p className="text-sm">
                {isLoginMode ? "Don't have an account yet?" : "Already have an account?"}
              </p>
              <Button
                variant="ghost"
                onClick={toggleMode}
                className="mt-1 text-blue-600 hover:text-blue-800"
              >
                {isLoginMode ? "Create an account" : "Sign in instead"}
              </Button>
            </StickyNote>
          </div>
        </div>
        
        {/* Right side - Hero section */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-amber-100 to-lime-100 p-8">
          <div className="flex flex-col justify-center max-w-lg mx-auto space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Unlock the Power of Your Ideas</h2>
              <p className="text-gray-700">
                Magic Notebook is more than just a note-taking app. Generate trials for popular services,
                organize your thoughts, and save money with our flexible packages.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <StickyNote color="pink" className="p-4 transform rotate-1">
                <h3 className="font-semibold mb-1">Take Beautiful Notes</h3>
                <p className="text-sm">
                  Capture your thoughts in a beautiful, distraction-free workspace with our sticky note system.
                </p>
              </StickyNote>
              
              <StickyNote color="purple" className="p-4 transform -rotate-1">
                <h3 className="font-semibold mb-1">Generate Trials with Commands</h3>
                <p className="text-sm">
                  Simply type a command and instantly generate trials for your favorite services.
                </p>
              </StickyNote>
              
              <StickyNote color="orange" className="p-4 transform rotate-1">
                <h3 className="font-semibold mb-1">Flexible Packages</h3>
                <p className="text-sm">
                  From free trials to unlimited subscriptions, choose the package that fits your needs.
                </p>
              </StickyNote>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;