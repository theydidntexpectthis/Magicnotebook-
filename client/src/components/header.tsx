import React from "react";
import { Book, Settings, User } from "lucide-react";
import { useUser } from "@/context/user-context";
import { StickyNote } from "@/components/ui/sticky-note";

const Header: React.FC = () => {
  const { user } = useUser();

  return (
    <header className="py-3 px-4 bg-gray-50">
      <div className="flex items-center justify-between relative">
        <StickyNote 
          color="green" 
          className="py-2 px-4 flex items-center space-x-3 transform -rotate-1 min-w-[200px]"
        >
          <div className="text-gray-800 h-9 w-9 flex items-center justify-center rounded-sm bg-green-300/50">
            <Book size={20} />
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Magic Notebook</h1>
        </StickyNote>
        
        <div className="flex items-center space-x-3">
          <StickyNote color="blue" className="p-2 flex items-center transform rotate-1">
            <button className="text-gray-700 hover:text-gray-900 transition-colors">
              <Settings size={20} />
            </button>
          </StickyNote>
          
          <StickyNote color="yellow" className="p-2 transform -rotate-1">
            <div className="h-8 w-8 rounded-full bg-amber-300/50 flex items-center justify-center text-gray-800">
              {user ? (
                <span className="text-sm font-medium">{user.username.charAt(0).toUpperCase()}</span>
              ) : (
                <User size={16} />
              )}
            </div>
          </StickyNote>
        </div>
      </div>
    </header>
  );
};

export default Header;
