import React, { useState } from "react";
import { Rocket, Gem, Crown, Infinity } from "lucide-react";
import { useUser } from "@/context/user-context";
import { Button } from "@/components/ui/button";
import { Check, X, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Collapsible, 
  CollapsibleTrigger, 
  CollapsibleContent 
} from "@/components/ui/collapsible";

const PackageSelection: React.FC = () => {
  const { 
    packages, 
    selectedPackageId, 
    setSelectedPackageId, 
    purchasePackage, 
    isPurchasing,
    userPackage,
    isLoading
  } = useUser();
  
  const [isOpen, setIsOpen] = useState(true);

  // If user already has a package, show collapsed view
  if (userPackage) {
    return (
      <Collapsible 
        open={isOpen} 
        onOpenChange={setIsOpen} 
        className="bg-white rounded-xl shadow-sm p-4 md:p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Your Active Package: {userPackage.packageName}
            </h2>
            <p className="text-gray-600">
              Remaining trials: {userPackage.trialsRemaining === -1 ? 'Unlimited' : userPackage.trialsRemaining}
            </p>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              <span className="ml-1">{isOpen ? 'Hide' : 'Details'}</span>
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="mt-4">
          <div className="text-sm text-gray-600">
            <p>Purchase date: {new Date(userPackage.purchasedAt).toLocaleDateString()}</p>
            {userPackage.packageName === "Lifetime" ? (
              <p className="text-primary font-medium mt-2">
                You have lifetime access to all features!
              </p>
            ) : (
              <p className="mt-2">
                Need more trials? <a href="#" className="text-primary underline">Upgrade your package</a>
              </p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-full max-w-lg mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-80 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'rocket':
        return <Rocket className="text-primary" />;
      case 'gem':
        return <Gem className="text-primary" />;
      case 'crown':
        return <Crown className="text-primary" />;
      case 'infinity':
        return <Infinity className="text-primary" />;
      default:
        return <Rocket className="text-primary" />;
    }
  };

  return (
    <div id="package-section" className="bg-white rounded-xl shadow-sm p-4 md:p-6">
      <h2 className="text-xl font-semibold mb-4">Select a Package</h2>
      <p className="text-gray-600 mb-6">
        Choose a package to unlock advanced features and trial generation.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`package-card border ${
              selectedPackageId === pkg.id 
                ? 'border-2 border-primary shadow-md' 
                : pkg.isBestValue 
                  ? 'border-2 border-primary' 
                  : 'border'
            } rounded-lg p-4 hover:shadow-md cursor-pointer transition-all relative`}
            onClick={() => setSelectedPackageId(pkg.id)}
          >
            {pkg.isBestValue && (
              <div className="absolute -top-2 -right-2 bg-primary text-white text-xs font-semibold px-2 py-1 rounded-full">
                BEST VALUE
              </div>
            )}

            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-3">
              {renderIcon(pkg.icon)}
            </div>

            <h3 className="font-semibold text-lg">{pkg.name}</h3>
            <div className="text-2xl font-bold my-2">
              ${(pkg.price / 100).toFixed(2)}
            </div>
            <p className="text-gray-600 text-sm mb-3">
              {pkg.name === "Basic" && "Get started with essential features"}
              {pkg.name === "Standard" && "Perfect for regular users"}
              {pkg.name === "Premium" && "For power users"}
              {pkg.name === "Lifetime" && "Unlimited access forever"}
            </p>

            <ul className="text-sm space-y-2 mb-4">
              {pkg.features.map((feature, i) => (
                <li key={i} className="flex items-center">
                  <Check size={16} className="text-success mr-2" />
                  <span>{feature}</span>
                </li>
              ))}
              {pkg.name === "Basic" && (
                <li className="flex items-center text-gray-400">
                  <X size={16} className="mr-2" />
                  <span>Premium Services</span>
                </li>
              )}
            </ul>

            <Button
              className="w-full"
              variant={selectedPackageId === pkg.id || pkg.isBestValue ? "default" : "outline"}
              onClick={() => setSelectedPackageId(pkg.id)}
            >
              Select
            </Button>
          </div>
        ))}
      </div>

      {selectedPackageId && (
        <Button 
          className="mx-auto block"
          onClick={() => purchasePackage()}
          disabled={isPurchasing}
        >
          {isPurchasing ? "Processing..." : "Purchase Selected Package"}
        </Button>
      )}
    </div>
  );
};

export default PackageSelection;
