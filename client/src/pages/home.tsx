import React from "react";
import Header from "@/components/header";
import NoteEditor from "@/components/note-editor";
import PackageSelection from "@/components/package-selection";
import CommandArea from "@/components/command-area";
import { useUser } from "@/context/user-context";
import { Loader2 } from "lucide-react";

const Home: React.FC = () => {
  const { isLoading, userPackage } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading Magic Notebook...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 overflow-x-hidden overflow-y-auto pt-2">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6 max-w-screen-xl">
          <div className="grid grid-cols-1 gap-6">
            {/* Command area shown at top for mobile if package exists */}
            <div className="block md:hidden">
              {userPackage && <CommandArea />}
            </div>
            
            {/* Package selection on top for mobile if no package */}
            <div className="block md:hidden">
              {!userPackage && <PackageSelection />}
            </div>
            
            {/* Note editor */}
            <NoteEditor />
            
            {/* Package selection below note editor for desktop, or if already has package on mobile */}
            <div className="hidden md:block">
              <PackageSelection />
            </div>
            
            {/* Command area at bottom for desktop */}
            <div className="hidden md:block">
              {userPackage && <CommandArea />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
