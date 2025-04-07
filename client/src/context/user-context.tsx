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
  const [isPackagesLoading, setIsPackagesLoading] = useState(true);
  const [isUserPackageLoading, setIsUserPackageLoading] = useState(true);

  // Fetch current user
  useQuery<User | null>({
    queryKey: ["/api/user"],
    retry: false,
    onSuccess: (data) => {
      setUser(data);
      setIsUserLoading(false);
    },
    onError: () => {
      setIsUserLoading(false);
    }
  });

  // Fetch all packages
  useQuery<Package[]>({
    queryKey: ["/api/packages"],
    enabled: !!user,
    onSuccess: (data) => {
      setPackages(data || []);
      setIsPackagesLoading(false);
    },
    onError: () => {
      setIsPackagesLoading(false);
    }
  });

  // Fetch user's active package
  useQuery<UserPackage | null>({
    queryKey: ["/api/user/package"],
    enabled: !!user,
    retry: false,
    onSuccess: (data) => {
      setUserPackage(data);
      setIsUserPackageLoading(false);
    },
    onError: () => {
      setIsUserPackageLoading(false);
    }
  });

  // Purchase a package
  const { mutate: purchasePackage, isPending: isPurchasing } = useMutation({
    mutationFn: async () => {
      if (!selectedPackageId) throw new Error("No package selected");
      const response = await apiRequest("POST", "/api/packages/purchase", { packageId: selectedPackageId });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Package purchased!",
        description: `Your ${data.packageName} package has been activated.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/package"] });
    },
    onError: (error) => {
      toast({
        title: "Purchase failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

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
