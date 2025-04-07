import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { StickyNote } from '@/components/ui/sticky-note';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, CreditCard, KeyRound, LogOut } from 'lucide-react';
import { useLocation } from 'wouter';

// Form validation schema
const profileSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }).optional().nullable(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const UserSettings = () => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, isLoading, logout } = useAuth();

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: user?.email || '',
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        email: user.email || '',
      });
    }
  }, [user, profileForm]);

  const handleProfileSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      // This would be implemented in a real app
      // const response = await apiRequest('PATCH', '/api/user/profile', data);
      
      // Fake success for now
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: 'Profile updated',
        description: 'Your profile information has been updated successfully',
      });
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/auth');
    } catch (error) {
      // Error is handled by the useAuth hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">User Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StickyNote color="yellow" className="p-6 transform rotate-1">
          <div className="flex items-center space-x-3 mb-4">
            <User className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Profile Information</h2>
          </div>
          
          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username"
                value={user?.username || ''}
                disabled
                className="bg-white/70"
              />
              <p className="text-xs text-gray-500">Username cannot be changed</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email"
                {...profileForm.register('email')}
                className="bg-white/70"
                placeholder="Your email address"
              />
              {profileForm.formState.errors.email && (
                <p className="text-sm text-red-500">{profileForm.formState.errors.email.message}</p>
              )}
            </div>
            
            <Button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </form>
        </StickyNote>
        
        <StickyNote color="blue" className="p-6 transform -rotate-1">
          <div className="flex items-center space-x-3 mb-4">
            <CreditCard className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Subscription</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="font-medium">Current Package</p>
              <p className="text-gray-700">
                {user?.userPackage?.packageName || 'No active package'}
              </p>
            </div>
            
            <div>
              <p className="font-medium">Trials Remaining</p>
              <p className="text-gray-700">
                {user?.userPackage?.trialsRemaining === -1 
                  ? 'Unlimited' 
                  : user?.userPackage?.trialsRemaining || '0'}
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setLocation('/app')}
              className="w-full"
            >
              Manage Subscription
            </Button>
          </div>
        </StickyNote>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StickyNote color="pink" className="p-6 transform rotate-1">
          <div className="flex items-center space-x-3 mb-4">
            <KeyRound className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Security</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Password management and security settings will be available soon.
            </p>
            
            <Button
              variant="outline"
              disabled
              className="w-full"
            >
              Change Password
            </Button>
          </div>
        </StickyNote>
        
        <StickyNote color="orange" className="p-6 transform -rotate-1">
          <div className="flex items-center space-x-3 mb-4">
            <LogOut className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Account</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Sign out of your account or manage other account settings.
            </p>
            
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700"
            >
              Sign Out
            </Button>
          </div>
        </StickyNote>
      </div>
    </div>
  );
};

export default UserSettings;