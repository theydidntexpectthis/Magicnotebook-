import React, { useState } from "react";
import Header from "@/components/header";
import NoteEditor from "@/components/note-editor";
import NotesGrid from "@/components/notes-grid";
import PackageSelection from "@/components/package-selection";
import CommandArea from "@/components/command-area";
import { useUser } from "@/context/user-context";
import { Loader2, NotebookPen, LayoutGrid } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StickyNote } from "@/components/ui/sticky-note";

const Home: React.FC = () => {
  const { isLoading, userPackage } = useUser();
  const [activeTab, setActiveTab] = useState<"editor" | "notes">("editor");

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
            
            {/* Note Mode Toggle */}
            <div className="flex justify-center">
              <StickyNote color="blue" className="inline-block transform rotate-1">
                <Tabs 
                  defaultValue="editor" 
                  value={activeTab} 
                  onValueChange={(value) => setActiveTab(value as "editor" | "notes")}
                  className="w-[300px]"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="editor" className="flex items-center">
                      <NotebookPen className="w-4 h-4 mr-2" />
                      Editor
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="flex items-center">
                      <LayoutGrid className="w-4 h-4 mr-2" />
                      All Notes
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </StickyNote>
            </div>
            
            {/* Note Content */}
            <div className="min-h-[50vh]">
              {activeTab === "editor" ? (
                <NoteEditor />
              ) : (
                <NotesGrid />
              )}
            </div>
            
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
