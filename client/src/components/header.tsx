import React, { useState } from "react";
import { Book, Settings, User, Home, Package, CreditCard, LogOut } from "lucide-react";
import { useUser } from "@/context/user-context";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { StickyNote } from "@/components/ui/sticky-note";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Header: React.FC = () => {
  const { userPackage } = useUser();
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setLocation("/auth");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navigateTo = (path: string) => {
    setLocation(path);
  };

  return (
    <header className="py-3 px-4 bg-gray-50">
      <div className="flex items-center justify-between relative">
        <StickyNote 
          color="green" 
          className="py-2 px-4 flex items-center space-x-3 transform -rotate-1 min-w-[200px] cursor-pointer"
          onClick={() => navigateTo(user ? "/app" : "/")}
        >
          <div className="text-gray-800 h-9 w-9 flex items-center justify-center rounded-sm bg-green-300/50">
            <Book size={20} />
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Magic Notebook</h1>
        </StickyNote>
        
        <div className="flex items-center space-x-3">
          {user && (
            <div className="hidden sm:flex items-center space-x-3 mr-2">
              <Button 
                variant="ghost" 
                className="flex items-center" 
                onClick={() => navigateTo("/app")}
              >
                <Home className="h-4 w-4 mr-2" />
                <span>Dashboard</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="flex items-center" 
                onClick={() => navigateTo("/checkout")}
              >
                <Package className="h-4 w-4 mr-2" />
                <span>Packages</span>
              </Button>
            </div>
          )}
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div>
                  <StickyNote color="yellow" className="p-2 transform -rotate-1 cursor-pointer">
                    <div className="h-8 w-8 rounded-full bg-amber-300/50 flex items-center justify-center text-gray-800">
                      <span className="text-sm font-medium">{user.username.charAt(0).toUpperCase()}</span>
                    </div>
                  </StickyNote>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="h-8 w-8 rounded-full bg-amber-200 flex items-center justify-center">
                    <span className="font-medium">{user.username.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{user.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {typeof user.email === 'string' ? user.email : "No email"}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigateTo("/app")}>
                  <Home className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigateTo("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigateTo("/checkout")}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Manage Subscription</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigateTo("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {!user && (
            <StickyNote color="purple" className="p-2 transform -rotate-1">
              <Button 
                className="h-8 px-3" 
                size="sm"
                onClick={() => navigateTo("/auth")}
              >
                Login
              </Button>
            </StickyNote>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
