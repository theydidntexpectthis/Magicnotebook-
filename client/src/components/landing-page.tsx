import React from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/user-context";
import { useLocation } from "wouter";
import { Lightbulb, Wand2, Share2, Users, ArrowRight } from "lucide-react";
import { StickyNote } from "@/components/ui/sticky-note";

const LandingPage: React.FC = () => {
  const { packages } = useUser();
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation("/auth");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white to-yellow-50">
      {/* Hero Section */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <div className="relative">
            {/* Floating sticky notes */}
            <div className="absolute -top-12 left-1/4 transform -rotate-12">
              <StickyNote color="yellow" className="p-3 animate-float">
                <p className="text-sm font-handwritten">Sign up for free!</p>
              </StickyNote>
            </div>
            <div className="absolute top-0 right-1/4 transform rotate-6">
              <StickyNote color="blue" className="p-3 animate-float" style={{ animationDelay: "1s" }}>
                <p className="text-sm font-handwritten">Schedule meeting</p>
              </StickyNote>
            </div>
            <div className="absolute -top-8 right-1/3 transform -rotate-3">
              <StickyNote color="green" className="p-3 animate-float" style={{ animationDelay: "2s" }}>
                <p className="text-sm font-handwritten">Blog post ideas</p>
              </StickyNote>
            </div>

            {/* Main heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-navy-900 mb-6">
              Write it. Wish it.
              <br />
              Watch it work.
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              The magical notebook that transforms your notes into actions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button 
                size="lg"
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-lg px-8"
                onClick={handleGetStarted}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="text-lg"
                onClick={() => setLocation("/demo")}
              >
                Watch in action
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto mt-20">
            <div className="text-left">
              <div className="bg-yellow-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Lightbulb className="h-6 w-6 text-yellow-700" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Suggestions</h3>
              <p className="text-gray-600">
                Get automatic to-dos generated from your notes.
              </p>
            </div>

            <div className="text-left">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Wand2 className="h-6 w-6 text-purple-700" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Built-in Agents</h3>
              <p className="text-gray-600">
                Automate your tasks with AI-powered commands.
              </p>
            </div>

            <div className="text-left">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Share2 className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Magic Marketplace</h3>
              <p className="text-gray-600">
                Discover and share custom automations with others.
              </p>
            </div>

            <div className="text-left">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-700" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Join the Community</h3>
              <p className="text-gray-600">
                Connect through collaborative notes and referrals.
              </p>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="mt-32">
            <h2 className="text-3xl font-bold mb-12">Choose your plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Plan */}
              <StickyNote color="yellow" className="p-8 transform hover:scale-105 transition-transform">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <p className="text-gray-600 mb-4">Limited commands</p>
                <Button 
                  className="w-full bg-gray-900 hover:bg-gray-800"
                  onClick={handleGetStarted}
                >
                  Get Started
                </Button>
              </StickyNote>

              {/* Pro Plan */}
              <StickyNote color="blue" className="p-8 transform hover:scale-105 transition-transform">
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-full">
                  POPULAR
                </div>
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="text-3xl font-bold mb-1">$7.99 <span className="text-base font-normal text-gray-600">/mo</span></div>
                <p className="text-gray-600 mb-4">Unlimited trials & agents</p>
                <Button 
                  className="w-full bg-gray-900 hover:bg-gray-800"
                  onClick={handleGetStarted}
                >
                  Choose Pro
                </Button>
              </StickyNote>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Magic Notebook. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;