import React from "react";
import { Book, Settings, User } from "lucide-react";
import { useUser } from "@/context/user-context";

const Header: React.FC = () => {
  const { user } = useUser();

  return (
    <header className="bg-white shadow-sm py-3 px-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="text-primary h-9 w-9 flex items-center justify-center rounded-lg bg-primary/10">
          <Book size={20} />
        </div>
        <h1 className="text-xl font-semibold text-dark">Magic Notebook</h1>
      </div>
      <div className="flex items-center space-x-3">
        <button className="text-gray-500 hover:text-primary transition-colors">
          <Settings size={20} />
        </button>
        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
          {user ? (
            <span className="text-sm font-medium">{user.username.charAt(0).toUpperCase()}</span>
          ) : (
            <User size={16} />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
