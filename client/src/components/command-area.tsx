import React, { useState } from "react";
import { useUser } from "@/context/user-context";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Notification } from "@/components/notification";
import { StickyNote } from "@/components/ui/sticky-note";

const CommandArea: React.FC = () => {
  const { userPackage } = useUser();
  const { toast } = useToast();
  const [command, setCommand] = useState("");
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "processing";
    message: string;
  } | null>(null);

  const { mutate: executeCommand, isPending } = useMutation({
    mutationFn: async (command: string) => {
      setNotification({
        type: "processing",
        message: "Processing your command...",
      });
      const response = await apiRequest("POST", "/api/commands/execute", { command });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.status === "success") {
        setNotification({
          type: "success",
          message: data.message,
        });
      } else {
        setNotification({
          type: "error",
          message: data.message,
        });
      }
      setCommand("");
      queryClient.invalidateQueries({ queryKey: ["/api/user/package"] });
      queryClient.invalidateQueries({ queryKey: ["/api/commands/history"] });
    },
    onError: (error) => {
      setNotification({
        type: "error",
        message: (error as Error).message,
      });
    },
  });

  const handleCommandExecution = () => {
    if (!command) {
      toast({
        title: "Command required",
        description: "Please enter a command to execute",
        variant: "destructive",
      });
      return;
    }
    
    // Format command to handle the new "/" format
    let commandToExecute = command;
    if (command.startsWith('/')) {
      // Convert /netflix to generateTrial Netflix
      commandToExecute = `generateTrial ${command.substring(1)}`;
    } else if (!command.includes(' ')) {
      // If they just typed "netflix" without slash or space, add generateTrial
      commandToExecute = `generateTrial ${command}`;
    }
    
    executeCommand(commandToExecute);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCommandExecution();
    }
  };

  return (
    <>
      <StickyNote color="purple" className="overflow-hidden transform rotate-2">
        <div className="p-3 md:p-4">
          <h3 className="font-medium text-gray-800 flex items-center">
            <span className="inline-block p-1 mr-2 bg-gray-800 rounded-full text-purple-100">
              {userPackage?.trialsRemaining === -1 ? "∞" : userPackage?.trialsRemaining}
            </span>
            Magic Commands ✨
          </h3>
          <p className="text-sm text-gray-700 md:mt-1">
            Type commands to generate trials and save money!
          </p>
        </div>
        <div className="p-3 md:p-4 pt-0">
          {/* Mobile command input */}
          <div className="md:hidden">
            <StickyNote color="yellow" className="p-2 px-3 mb-2 transform -rotate-1">
              <Input
                type="text"
                placeholder="Type /netflix or /spotify..."
                className="bg-transparent border-none shadow-none focus-visible:ring-0 flex-1 text-sm text-gray-800"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isPending}
              />
            </StickyNote>
            <StickyNote color="green" className="transform rotate-1 p-1">
              <Button
                className="w-full bg-gray-800 hover:bg-gray-700"
                size="sm"
                onClick={handleCommandExecution}
                disabled={isPending}
              >
                {isPending ? "Casting spell..." : "Run Command"}
              </Button>
            </StickyNote>
          </div>

          {/* Desktop command input */}
          <div className="hidden md:block">
            <StickyNote color="yellow" className="p-3 flex items-center transform -rotate-1">
              <span className="text-gray-800 font-bold mr-2">/</span>
              <Input
                type="text"
                placeholder="Type spotify, netflix, hulu, etc..."
                className="bg-transparent border-none shadow-none focus-visible:ring-0 flex-1 text-gray-800"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isPending}
              />
              <Button
                className="ml-2 bg-gray-800 hover:bg-gray-700"
                size="sm"
                onClick={handleCommandExecution}
                disabled={isPending}
              >
                {isPending ? "Casting..." : "Run"}
              </Button>
            </StickyNote>
          </div>

          <StickyNote color="blue" className="mt-3 text-sm text-gray-800 p-2 transform rotate-1">
            <p>Examples: <span className="font-mono text-gray-800 bg-blue-300/50 px-1 rounded-sm">/spotify</span> or <span className="font-mono text-gray-800 bg-blue-300/50 px-1 rounded-sm">/netflix</span></p>
            <p className="mt-1">
              <span className="font-semibold">{userPackage?.packageName} Package</span> - <span className="font-semibold">{userPackage?.trialsRemaining === -1 ? "Unlimited" : userPackage?.trialsRemaining} trials left</span>
            </p>
          </StickyNote>
        </div>
      </StickyNote>

      {notification && (
        <div className="fixed bottom-4 right-4 w-auto max-w-[90%] md:w-80 z-50">
          <Notification
            type={notification.type}
            message={notification.message}
            onDismiss={() => setNotification(null)}
          />
        </div>
      )}
    </>
  );
};

export default CommandArea;
