import React, { useState } from "react";
import { useUser } from "@/context/user-context";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Notification } from "@/components/notification";

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
    
    executeCommand(command);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCommandExecution();
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 p-3 md:p-4">
          <h3 className="font-medium text-gray-700 flex items-center">
            <span className="inline-block p-1 mr-2 bg-primary/10 rounded-full text-primary">
              {userPackage?.trialsRemaining === -1 ? "∞" : userPackage?.trialsRemaining}
            </span>
            Command Input
          </h3>
          <p className="text-xs md:text-sm text-gray-500 md:mt-1">
            Enter commands to generate trials and access advanced features.
          </p>
        </div>
        <div className="p-3 md:p-4">
          {/* Mobile command input */}
          <div className="md:hidden">
            <div className="command-input bg-gray-50 p-2 px-3 rounded-lg border-l-4 border-primary mb-2">
              <Input
                type="text"
                placeholder="Type command (e.g., Netflix)"
                className="bg-transparent border-none shadow-none focus-visible:ring-0 flex-1 text-sm"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isPending}
              />
            </div>
            <Button
              className="w-full mb-2"
              size="sm"
              onClick={handleCommandExecution}
              disabled={isPending}
            >
              {isPending ? "Executing..." : "Execute Command"}
            </Button>
          </div>

          {/* Desktop command input */}
          <div className="hidden md:block">
            <div className="command-input bg-gray-50 p-3 pl-4 rounded-lg flex items-center border-l-4 border-primary">
              <span className="text-primary mr-2">!</span>
              <Input
                type="text"
                placeholder="Type your command here (e.g., generateTrial Netflix)"
                className="bg-transparent border-none shadow-none focus-visible:ring-0 flex-1"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isPending}
              />
              <Button
                className="ml-2"
                size="sm"
                onClick={handleCommandExecution}
                disabled={isPending}
              >
                {isPending ? "Executing..." : "Execute"}
              </Button>
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            <p>Example: <code>!generateTrial Netflix</code> or <code>!generateTrial Spotify</code></p>
            <p className="mt-1">
              Package: <strong>{userPackage?.packageName}</strong> - Trials: <strong>{userPackage?.trialsRemaining === -1 ? "Unlimited" : userPackage?.trialsRemaining}</strong>
            </p>
          </div>
        </div>
      </div>

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
