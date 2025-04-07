import React from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/user-context";
import { useLocation } from "wouter";
import { Pen, Wand2, Package, ArrowRight, CheckCircle } from "lucide-react";
import NotebookHero from "./notebook-hero";

const LandingPage: React.FC = () => {
  const { packages, setSelectedPackageId } = useUser();
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation("/app");
  };

  const handleSelectPackage = (packageId: number) => {
    setSelectedPackageId(packageId);
    setLocation("/app");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-12 md:py-20 px-4 bg-gradient-to-r from-amber-50 to-blue-50">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0 pr-0 md:pr-8">
            <h1 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4">
              Unlock the Power of Your Ideas
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-6">
              More Than Just Notes—It's a Gateway to Unlimited Trials!
            </p>
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6"
              onClick={handleGetStarted}
            >
              Get Started
            </Button>
          </div>
          <div className="md:w-1/2">
            <div className="relative flex items-center justify-center">
              <div className="rounded-lg shadow-lg border border-blue-100 p-3 bg-white">
                <NotebookHero />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16 px-4 bg-amber-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-navy-900">
            Why Choose Magic Notebook?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-blue-100 p-3 rounded-full mb-4">
                <Pen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Seamless Note-Taking</h3>
              <p className="text-gray-600">
                Easily organize your thoughts with intuitive interface.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-blue-100 p-3 rounded-full mb-4">
                <Wand2 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Unlock Advanced Features</h3>
              <p className="text-gray-600">
                Generate real-life trial accounts using simple commands.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-blue-100 p-3 rounded-full mb-4">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Package Options</h3>
              <p className="text-gray-600">
                Unlock advanced features with any package purchase.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 md:py-16 px-4 bg-blue-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-8 text-navy-900">
            Choose Your Package
          </h2>
          
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6 mx-auto max-w-4xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {packages.map((pkg) => (
                <div 
                  key={pkg.id} 
                  className="p-6 border-b sm:border-b-0 sm:border-r border-gray-200 relative flex flex-col"
                >
                  {pkg.isBestValue && (
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs py-1 px-2 rounded-bl">
                      BEST VALUE
                    </div>
                  )}
                  
                  <h3 className="text-lg font-semibold mb-2">{pkg.name} Package</h3>
                  <div className="text-3xl font-bold mb-2">${(pkg.price / 100).toFixed(2)}</div>
                  <p className="text-gray-600 text-sm mb-auto">
                    {pkg.trialCount === -1 ? 'Unlimited trials' : `${pkg.trialCount} trials`}
                  </p>
                  
                  <Button 
                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleSelectPackage(pkg.id)}
                  >
                    Select
                  </Button>
                </div>
              ))}
            </div>
            <div className="p-4 text-center text-sm text-gray-600 border-t border-gray-200">
              Unlock advanced features with any package purchase!
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-16 px-4 bg-amber-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-navy-900">
            How Magic Notebook Works
          </h2>
          
          <div className="flex flex-col md:flex-row items-center justify-center md:space-x-4 space-y-8 md:space-y-0">
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 p-4 rounded-lg mb-3">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium">Purchase a Package</h3>
            </div>
            
            <ArrowRight className="hidden md:block w-6 h-6 text-gray-400" />
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 p-4 rounded-lg mb-3">
                <Pen className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium">Start taking notes</h3>
            </div>
            
            <ArrowRight className="hidden md:block w-6 h-6 text-gray-400" />
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 p-4 rounded-lg mb-3">
                <Wand2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium">Generate Trials</h3>
            </div>
            
            <ArrowRight className="hidden md:block w-6 h-6 text-gray-400" />
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 p-4 rounded-lg mb-3">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium">Enjoy Services</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-300">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <div className="font-bold text-xl mb-2">Magic Notebook</div>
            <p className="text-sm opacity-75 mb-4">
              The ultimate note-taking app with trial generation capabilities
            </p>
            <p className="text-xs opacity-50">
              © {new Date().getFullYear()} Magic Notebook. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;