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
    <div className="flex flex-col h-screen bg-light">
      <Header />
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto p-4 md:p-6 flex flex-col space-y-6">
          <NoteEditor />
          <PackageSelection />
          {userPackage && <CommandArea />}
        </div>
      </main>
    </div>
  );
};

export default Home;
