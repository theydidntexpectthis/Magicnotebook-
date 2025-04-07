import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Package = {
  id: number;
  name: string;
  price: number;
  trialCount: number;
  features: string[];
  isBestValue: boolean;
  icon: string;
};

type UserPackage = {
  id: number;
  packageId: number;
  packageName: string;
  purchasedAt: string;
  trialsRemaining: number;
  isActive: boolean;
};

type User = {
  id: number;
  username: string;
};

type UserContextType = {
  user: User | null;
  isLoading: boolean;
  userPackage: UserPackage | null;
  packages: Package[];
  selectedPackageId: number | null;
  setSelectedPackageId: (id: number | null) => void;
  purchasePackage: () => void;
  isPurchasing: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);

  // Default values for initial state
  const [user, setUser] = useState<User | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [userPackage, setUserPackage] = useState<UserPackage | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isPackagesLoading, setIsPackagesLoading] = useState(false);
  const [isUserPackageLoading, setIsUserPackageLoading] = useState(false);

  // Set a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isUserLoading) {
        setIsUserLoading(false);
        console.log("Forced loading state to complete after timeout");
        // Set a default demo user if loading takes too long
        if (!user) {
          setUser({ id: 1, username: "demo" });
        }
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [isUserLoading, user]);

  // Fetch current user
  const userQuery = useQuery<User | null>({
    queryKey: ["/api/user"],
    retry: 1
  });
  
  // Update state when user data changes
  useEffect(() => {
    if (userQuery.isSuccess) {
      setUser(userQuery.data);
      setIsUserLoading(false);
    } else if (userQuery.isError) {
      setIsUserLoading(false);
    }
  }, [userQuery.isSuccess, userQuery.isError, userQuery.data]);

  // Fetch all packages
  const packagesQuery = useQuery<Package[]>({
    queryKey: ["/api/packages"],
    enabled: !!user,
    retry: 1
  });
  
  // Update state when packages data changes
  useEffect(() => {
    if (packagesQuery.isSuccess) {
      setPackages(packagesQuery.data || []);
      setIsPackagesLoading(false);
    } else if (packagesQuery.isError) {
      setIsPackagesLoading(false);
      // Set some default packages on error
      setPackages([
        {
          id: 1,
          name: "Basic",
          price: 999,
          trialCount: 3,
          features: ["3 trial generations", "Basic support", "Standard templates"],
          isBestValue: false,
          icon: "💼"
        },
        {
          id: 2,
          name: "Standard",
          price: 1999,
          trialCount: 10,
          features: ["10 trial generations", "Priority support", "Premium templates", "API access"],
          isBestValue: true,
          icon: "🌟"
        },
        {
          id: 3,
          name: "Premium",
          price: 4999,
          trialCount: 30,
          features: ["30 trial generations", "24/7 support", "All templates", "API access", "Advanced analytics"],
          isBestValue: false,
          icon: "💎"
        }
      ]);
    }
  }, [packagesQuery.isSuccess, packagesQuery.isError, packagesQuery.data]);

  // Fetch user's active package
  const userPackageQuery = useQuery<UserPackage | null>({
    queryKey: ["/api/user/package"],
    enabled: !!user,
    retry: 1
  });
  
  // Update state when user package data changes
  useEffect(() => {
    if (userPackageQuery.isSuccess) {
      setUserPackage(userPackageQuery.data);
      setIsUserPackageLoading(false);
    } else if (userPackageQuery.isError) {
      setIsUserPackageLoading(false);
    }
  }, [userPackageQuery.isSuccess, userPackageQuery.isError, userPackageQuery.data]);

  // Purchase a package mutation
  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPackageId) throw new Error("No package selected");
      const response = await apiRequest("POST", "/api/packages/purchase", { packageId: selectedPackageId });
      return response.json();
    }
  });
  
  // Handle purchase success
  useEffect(() => {
    if (purchaseMutation.isSuccess && purchaseMutation.data) {
      toast({
        title: "Package purchased!",
        description: `Your ${purchaseMutation.data.packageName} package has been activated.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/package"] });
    }
  }, [purchaseMutation.isSuccess, purchaseMutation.data, toast]);
  
  // Handle purchase error
  useEffect(() => {
    if (purchaseMutation.isError) {
      toast({
        title: "Purchase failed",
        description: (purchaseMutation.error as Error).message,
        variant: "destructive",
      });
    }
  }, [purchaseMutation.isError, purchaseMutation.error, toast]);
  
  // Function to trigger package purchase
  const purchasePackage = () => {
    purchaseMutation.mutate();
  };
  
  const isPurchasing = purchaseMutation.isPending;

  const isLoading = isUserLoading || isPackagesLoading || isUserPackageLoading;

  const value: UserContextType = {
    user: user ?? null,
    isLoading,
    userPackage: userPackage ?? null,
    packages: packages ?? [],
    selectedPackageId,
    setSelectedPackageId,
    purchasePackage,
    isPurchasing,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
