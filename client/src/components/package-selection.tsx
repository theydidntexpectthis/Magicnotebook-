import React, { useState } from "react";
import { Rocket, Gem, Crown, Infinity } from "lucide-react";
import { useUser } from "@/context/user-context";
import { Button } from "@/components/ui/button";
import { Check, X, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StickyNote } from "@/components/ui/sticky-note";
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
    const getStickyColor = () => {
      switch (userPackage.packageName) {
        case "Basic": return "blue";
        case "Standard": return "green";
        case "Premium": return "purple";
        case "Lifetime": return "orange";
        default: return "yellow";
      }
    };
    
    return (
      <StickyNote color={getStickyColor()} className="p-4 md:p-5 transform rotate-1">
        <Collapsible 
          open={isOpen} 
          onOpenChange={setIsOpen} 
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Your Package: {userPackage.packageName}
              </h2>
              <p className="text-gray-700">
                {userPackage.trialsRemaining === -1 
                  ? '✨ Unlimited trials available' 
                  : `✨ ${userPackage.trialsRemaining} trials remaining`}
              </p>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900">
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                <span className="ml-1">{isOpen ? 'Hide' : 'Details'}</span>
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="mt-4">
            <div className="text-sm text-gray-700">
              <p>Purchase date: {new Date(userPackage.purchasedAt).toLocaleDateString()}</p>
              {userPackage.packageName === "Lifetime" ? (
                <p className="font-medium mt-2 text-amber-700">
                  You have lifetime access to all features! ✨
                </p>
              ) : (
                <p className="mt-2">
                  Need more trials? <a href="#" className="text-blue-700 underline font-medium">Upgrade your package</a>
                </p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </StickyNote>
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

  const getStickyColor = (index: number) => {
    const colors: ("yellow" | "green" | "pink" | "blue" | "purple" | "orange")[] = ["yellow", "green", "pink", "blue", "purple", "orange"];
    return colors[index % colors.length];
  };
  
  const getRotation = (index: number) => {
    const rotations = [-2, -1, 0, 1, 2, 3];
    return rotations[index % rotations.length];
  };

  return (
    <div id="package-section" className="py-4 md:py-6">
      <StickyNote color="blue" className="mb-6 p-4 transform -rotate-1">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">Select Your Magic Package</h2>
        <p className="text-gray-700">
          Choose a package to unlock advanced features and trial generation magic. ✨
        </p>
      </StickyNote>

      {/* Desktop view - grid layout */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {packages.map((pkg, index) => (
          <StickyNote
            key={`desktop-${pkg.id}`}
            color={getStickyColor(index)}
            className={`p-4 cursor-pointer transition-transform hover:scale-105 transform ${
              selectedPackageId === pkg.id ? 'ring-4 ring-gray-800/20' : ''
            }`}
            style={{ transform: `rotate(${getRotation(index)}deg)` }}
            onClick={() => setSelectedPackageId(pkg.id)}
          >
            {pkg.isBestValue && (
              <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded-full transform rotate-12">
                BEST VALUE ⭐
              </div>
            )}

            <div className="mb-3 flex justify-center">
              {renderIcon(pkg.icon)}
            </div>

            <h3 className="font-semibold text-lg text-center text-gray-800 mb-2">{pkg.name}</h3>
            <div className="text-2xl font-bold mb-2 text-center text-gray-800">
              ${(pkg.price / 100).toFixed(2)}
            </div>
            <p className="text-gray-700 text-sm mb-3 text-center">
              {pkg.name === "Basic" && "Get started with essential features"}
              {pkg.name === "Standard" && "Perfect for regular users"}
              {pkg.name === "Premium" && "For power users"}
              {pkg.name === "Lifetime" && "Unlimited access forever"}
            </p>

            <ul className="text-sm space-y-2 mb-4 text-gray-700">
              {pkg.features.map((feature, i) => (
                <li key={i} className="flex items-center">
                  <Check size={16} className="text-green-600 mr-2" />
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
              variant={selectedPackageId === pkg.id ? "default" : "outline"}
              onClick={() => setSelectedPackageId(pkg.id)}
            >
              Select
            </Button>
          </StickyNote>
        ))}
      </div>
      
      {/* Mobile view - compact cards */}
      <div className="md:hidden space-y-4 mb-6">
        {packages.map((pkg, index) => (
          <StickyNote
            key={`mobile-${pkg.id}`}
            color={getStickyColor(index)}
            className={`p-3 cursor-pointer transition-all ${
              selectedPackageId === pkg.id ? 'ring-2 ring-gray-800/20' : ''
            }`}
            style={{ transform: `rotate(${getRotation(index)}deg)` }}
            onClick={() => setSelectedPackageId(pkg.id)}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center mr-3 shrink-0">
                {renderIcon(pkg.icon)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-800">{pkg.name}</h3>
                  <div className="font-bold text-right text-gray-800">
                    ${(pkg.price / 100).toFixed(2)}
                  </div>
                </div>
                
                <p className="text-xs text-gray-700 mb-1 truncate">
                  {pkg.features[0]}
                </p>
                
                {pkg.isBestValue && (
                  <span className="inline-block text-amber-600 text-xs font-semibold">
                    BEST VALUE ⭐
                  </span>
                )}
              </div>
              
              <div className="ml-3">
                <div className={`w-5 h-5 rounded-full border ${selectedPackageId === pkg.id ? 'border-gray-800 bg-gray-50' : 'border-gray-600'} flex items-center justify-center`}>
                  {selectedPackageId === pkg.id && (
                    <div className="w-3 h-3 rounded-full bg-gray-800"></div>
                  )}
                </div>
              </div>
            </div>
          </StickyNote>
        ))}
      </div>

      {selectedPackageId && (
        <div className="flex justify-center">
          <StickyNote color="green" className="inline-block p-2 transform rotate-2">
            <Button 
              className="px-6"
              onClick={() => purchasePackage()}
              disabled={isPurchasing}
            >
              {isPurchasing ? "Processing..." : "Purchase Package"}
            </Button>
          </StickyNote>
        </div>
      )}
    </div>
  );
};

export default PackageSelection;
