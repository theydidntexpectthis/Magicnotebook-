import React from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/user-context";
import { useLocation } from "wouter";
import { Pen, Wand2, Package, MessageSquare, DollarSign } from "lucide-react";
import { StickyNote } from "@/components/ui/sticky-note";

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
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Simple ChatGPT-style Hero */}
      <section className="py-16 px-4 flex-1 flex flex-col items-center justify-start">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Magic Notebook
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Take notes, use magic commands, and save money with trial services
          </p>
          <Button 
            size="lg" 
            className="bg-amber-400 hover:bg-amber-500 text-gray-800 font-medium px-8 py-6 rounded-md"
            onClick={handleGetStarted}
          >
            Get Started
          </Button>
        </div>

        {/* Sticky Notes Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          <StickyNote color="green" className="p-5 transform rotate-1 cursor-pointer hover:rotate-0">
            <div className="flex flex-col items-center text-center">
              <Pen className="w-8 h-8 text-gray-700 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Smart Note-Taking</h3>
              <p className="text-gray-700">
                Capture ideas in a beautiful, distraction-free workspace
              </p>
            </div>
          </StickyNote>
          
          <StickyNote color="yellow" className="p-5 transform -rotate-1 cursor-pointer hover:rotate-0">
            <div className="flex flex-col items-center text-center">
              <Wand2 className="w-8 h-8 text-gray-700 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Magic Commands</h3>
              <p className="text-gray-700">
                Type commands to instantly generate premium trials
              </p>
            </div>
          </StickyNote>
          
          <StickyNote color="pink" className="p-5 transform rotate-1 cursor-pointer hover:rotate-0">
            <div className="flex flex-col items-center text-center">
              <DollarSign className="w-8 h-8 text-gray-700 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Save Money</h3>
              <p className="text-gray-700">
                Get the package that fits your digital lifestyle
              </p>
            </div>
          </StickyNote>
        </div>

        {/* Command Example */}
        <div className="w-full max-w-3xl mx-auto mb-12">
          <StickyNote color="blue" className="p-5 transform -rotate-1">
            <div className="flex items-center">
              <MessageSquare className="w-6 h-6 text-gray-700 mr-3" />
              <p className="text-gray-800 font-medium">Type "/spotify" to generate a Spotify trial...</p>
            </div>
          </StickyNote>
        </div>

        {/* Sticky Note Packages */}
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {packages.map((pkg, index) => (
            <StickyNote 
              key={pkg.id} 
              color={
                index === 0 ? "green" : 
                index === 1 ? "yellow" : 
                index === 2 ? "blue" : 
                "purple"
              }
              className="p-5 transform hover:scale-105 transition-transform duration-200 cursor-pointer"
              onClick={() => handleSelectPackage(pkg.id)}
            >
              <div className="flex flex-col items-center text-center">
                {pkg.isBestValue && (
                  <div className="bg-gray-800 text-white text-xs py-1 px-2 rounded-md mb-2">
                    BEST VALUE
                  </div>
                )}
                <h3 className="text-lg font-semibold mb-2">{pkg.name} Package</h3>
                <div className="text-3xl font-bold mb-2">${(pkg.price / 100).toFixed(2)}</div>
                <p className="text-gray-700 text-sm mb-3">
                  {pkg.trialCount === -1 ? 'Unlimited trials' : `${pkg.trialCount} trials`}
                </p>
                <Button 
                  className="bg-gray-800 hover:bg-gray-700 w-full"
                >
                  Select
                </Button>
              </div>
            </StickyNote>
          ))}
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-6 px-4 bg-gray-100 border-t border-gray-200">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} Magic Notebook. Save time and money with smart notes & trials.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;