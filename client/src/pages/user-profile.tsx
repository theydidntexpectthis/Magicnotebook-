import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUser } from "@/context/user-context";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/header";
import { StickyNote } from "@/components/ui/sticky-note";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, UserCircle, CreditCard, ShieldCheck, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

// Profile form schema
const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email").nullable(),
  currentPassword: z.string().min(6, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters").optional(),
  confirmNewPassword: z.string().optional(),
}).refine(data => {
  if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
    return false;
  }
  return true;
}, {
  message: "New passwords do not match",
  path: ["confirmNewPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const { userPackage, packages } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  // Update form when user data changes
  React.useEffect(() => {
    if (user) {
      form.reset({
        username: user.username,
        email: user.email,
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    }
  }, [user, form]);

  const handleProfileSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        username: data.username,
        email: data.email,
        currentPassword: data.currentPassword,
      };

      // Only include new password if it's provided
      if (data.newPassword) {
        Object.assign(payload, { newPassword: data.newPassword });
      }

      const response = await apiRequest("PATCH", "/api/user/profile", payload);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      // Invalidate user query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
      
      // Reset form
      form.reset({
        ...form.getValues(),
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle going to package selection/checkout
  const handleManageSubscription = () => {
    setLocation("/checkout");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Please log in to view your profile</h1>
        <Button onClick={() => setLocation("/auth")}>
          Go to Login
        </Button>
      </div>
    );
  }

  // Find current package details if user has a package
  const currentPackage = userPackage ? 
    packages.find(p => p.id === userPackage.packageId) : null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 overflow-x-hidden overflow-y-auto pt-2">
        <div className="container mx-auto px-4 py-8 max-w-screen-xl">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-full md:w-64 mb-6 md:mb-0">
              <StickyNote color="blue" className="p-4 transform rotate-1">
                <div className="flex flex-col items-center mb-4">
                  <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                    <UserCircle className="h-12 w-12 text-blue-500" />
                  </div>
                  <h2 className="text-xl font-semibold">{user.username}</h2>
                  <p className="text-sm text-gray-500">{user.email || "No email set"}</p>
                </div>
                
                <Separator className="my-4" />
                
                <nav className="space-y-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    onClick={() => setLocation("/app")}
                  >
                    Dashboard
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start font-semibold"
                  >
                    Account Settings
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    onClick={() => setLocation("/checkout")}
                  >
                    Manage Subscription
                  </Button>
                </nav>
              </StickyNote>
            </div>
            
            <div className="flex-1 w-full">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="subscription">Subscription</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile">
                  <StickyNote color="yellow" className="p-6 transform -rotate-1">
                    <h2 className="text-xl font-semibold mb-6">Your Profile</h2>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Your username" {...field} />
                              </FormControl>
                              <FormDescription>
                                This is your public display name.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="email@example.com" 
                                  type="email"
                                  value={field.value || ''}
                                  onChange={e => field.onChange(e.target.value)}
                                />
                              </FormControl>
                              <FormDescription>
                                We'll use this for important notifications.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter your current password" 
                                  type="password" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Required to save changes.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="pt-4">
                          <Button 
                            type="submit" 
                            className="w-full md:w-auto" 
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </StickyNote>
                </TabsContent>
                
                <TabsContent value="subscription">
                  <StickyNote color="green" className="p-6 transform rotate-1">
                    <h2 className="text-xl font-semibold mb-6">Subscription</h2>
                    
                    {userPackage ? (
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4 border">
                          <div className="flex justify-between items-start">
                            <div>
                              <Badge variant="outline" className="mb-2 bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700">
                                Active
                              </Badge>
                              <h3 className="text-lg font-medium">{userPackage.packageName}</h3>
                              <p className="text-sm text-gray-500">
                                Purchased on {new Date(userPackage.purchasedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold">
                                ${(currentPackage?.price || 0) / 100}
                              </p>
                              <p className="text-sm text-gray-500">
                                {userPackage.trialsRemaining === -1 
                                  ? "Unlimited trials" 
                                  : `${userPackage.trialsRemaining} trials remaining`}
                              </p>
                            </div>
                          </div>
                          
                          <Separator className="my-4" />
                          
                          <div className="flex justify-end gap-3">
                            <Button 
                              variant="outline" 
                              size="sm"
                            >
                              View Invoice
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={handleManageSubscription}
                            >
                              Change Plan
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium mb-2">No Active Subscription</h3>
                        <p className="text-gray-500 mb-6">
                          You currently don't have an active subscription plan.
                        </p>
                        <Button onClick={handleManageSubscription}>
                          Choose a Plan
                        </Button>
                      </div>
                    )}
                  </StickyNote>
                </TabsContent>
                
                <TabsContent value="security">
                  <StickyNote color="pink" className="p-6 transform rotate-1">
                    <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                        <CardDescription>
                          Update your password to keep your account secure.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="currentPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Current Password</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter your current password" 
                                      type="password" 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="newPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>New Password</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter your new password" 
                                      type="password" 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="confirmNewPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Confirm New Password</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Confirm your new password" 
                                      type="password" 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <Button 
                              type="submit" 
                              className="mt-2" 
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="mr-2 h-4 w-4" />
                                  Update Password
                                </>
                              )}
                            </Button>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                    
                    <div className="mt-8">
                      <Card className="border-red-200">
                        <CardHeader>
                          <CardTitle className="text-red-600">Danger Zone</CardTitle>
                          <CardDescription>
                            Actions here can't be undone. Be careful!
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <Label>Delete Account</Label>
                            <p className="text-sm text-gray-500">
                              This will permanently delete your account and all associated data.
                            </p>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button variant="destructive" className="w-full md:w-auto">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Account
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>
                  </StickyNote>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;