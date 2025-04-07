import React, { useState } from "react";
import { useUser } from "@/context/user-context";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Notification } from "@/components/notification";
import { StickyNote } from "@/components/ui/sticky-note";
import { Gift, Truck, Calendar, CreditCard, Mail, Phone } from "lucide-react";
import { useMarkdown } from "@/hooks/use-markdown";

const CommandArea: React.FC = () => {
  const { userPackage } = useUser();
  const { toast } = useToast();
  const { renderMarkdown } = useMarkdown();
  const [command, setCommand] = useState("");
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "processing";
    message: string;
  } | null>(null);
  
  // State for the selected trial to view
  const [selectedTrial, setSelectedTrial] = useState<number | null>(null);
  
  // Fetch command history
  const { data: commandHistory } = useQuery<{
    id: number;
    command: string;
    serviceName: string;
    status: string;
    message: string;
    executedAt: string;
    trialData?: any;
  }[]>({
    queryKey: ["/api/commands/history"],
  });

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
          
          {/* Trial Delivery Section */}
          {commandHistory && commandHistory.length > 0 && (
            <StickyNote color="green" className="mt-3 text-sm text-gray-800 p-2 transform -rotate-1">
              <div className="flex items-center mb-1">
                <Truck className="w-4 h-4 mr-1" />
                <h4 className="font-medium">Trial Deliveries</h4>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {commandHistory
                  .filter(cmd => cmd.status === "success" && cmd.command.includes("generateTrial"))
                  .map((cmd) => (
                    <div 
                      key={cmd.id} 
                      className="flex items-center justify-between p-1 bg-green-100/50 rounded cursor-pointer hover:bg-green-200/50"
                      onClick={() => setSelectedTrial(selectedTrial === cmd.id ? null : cmd.id)}
                    >
                      <div>
                        <span className="font-semibold capitalize">{cmd.serviceName}</span>
                        <span className="text-xs text-gray-600 ml-1">
                          {new Date(cmd.executedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Gift className="w-3.5 h-3.5" />
                    </div>
                  ))}
                {commandHistory.filter(cmd => cmd.status === "success" && cmd.command.includes("generateTrial")).length === 0 && (
                  <p className="text-xs text-gray-600 italic">No trials generated yet</p>
                )}
              </div>
            </StickyNote>
          )}
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
      
      {/* Trial Detail Modal */}
      {selectedTrial && commandHistory && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-white rounded-lg shadow-lg">
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-2 top-2"
              onClick={() => setSelectedTrial(null)}
            >
              ✕
            </Button>
            
            {(() => {
              const trial = commandHistory.find(cmd => cmd.id === selectedTrial);
              if (!trial) return null;
              
              return (
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Gift className="mr-2 text-green-600" />
                    {trial.serviceName.charAt(0).toUpperCase() + trial.serviceName.slice(1)} Trial Details
                  </h3>
                  
                  {trial.trialData ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Account Details */}
                        {trial.trialData.accountDetails && (
                          <StickyNote color="yellow" className="p-3 transform rotate-1">
                            <h4 className="font-bold mb-2 flex items-center">
                              <Mail className="w-4 h-4 mr-1" /> 
                              Account Details
                            </h4>
                            <div className="space-y-1 text-sm">
                              <p><strong>Username:</strong> {trial.trialData.accountDetails.username || "N/A"}</p>
                              <p><strong>Email:</strong> {trial.trialData.accountDetails.email || "N/A"}</p>
                              <p><strong>Membership:</strong> {trial.trialData.accountDetails.membershipLevel || "Trial"}</p>
                            </div>
                          </StickyNote>
                        )}
                        
                        {/* Payment Information */}
                        {trial.trialData.paymentMethod && (
                          <StickyNote color="green" className="p-3 transform -rotate-1">
                            <h4 className="font-bold mb-2 flex items-center">
                              <CreditCard className="w-4 h-4 mr-1" /> 
                              Payment Method
                            </h4>
                            <div className="space-y-1 text-sm">
                              <p><strong>Type:</strong> {trial.trialData.paymentMethod.type}</p>
                              <p><strong>Card:</strong> •••• {trial.trialData.paymentMethod.last4}</p>
                              <p><strong>Expires:</strong> {trial.trialData.paymentMethod.expiryMonth}/{trial.trialData.paymentMethod.expiryYear}</p>
                            </div>
                          </StickyNote>
                        )}
                        
                        {/* Contact Information */}
                        <StickyNote color="blue" className="p-3 transform rotate-1">
                          <h4 className="font-bold mb-2 flex items-center">
                            <Phone className="w-4 h-4 mr-1" /> 
                            Contact Information
                          </h4>
                          <div className="space-y-1 text-sm">
                            {trial.trialData.email && (
                              <>
                                <p><strong>Email:</strong> {trial.trialData.email.email}</p>
                                <p><strong>Access Key:</strong> {trial.trialData.email.accessKey}</p>
                              </>
                            )}
                            {trial.trialData.phone && (
                              <>
                                <p><strong>Phone:</strong> {trial.trialData.phone.phoneNumber}</p>
                                <p><strong>Verification:</strong> {trial.trialData.phone.verificationCode}</p>
                              </>
                            )}
                          </div>
                        </StickyNote>
                        
                        {/* Trial Status */}
                        <StickyNote color="pink" className="p-3 transform -rotate-1">
                          <h4 className="font-bold mb-2 flex items-center">
                            <Calendar className="w-4 h-4 mr-1" /> 
                            Trial Status
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p><strong>Created:</strong> {new Date(trial.executedAt).toLocaleString()}</p>
                            {trial.trialData.signupTime && (
                              <p><strong>Signup:</strong> {trial.trialData.signupTime}</p>
                            )}
                            {trial.trialData.trialEndDate && (
                              <p><strong>Expires:</strong> {trial.trialData.trialEndDate}</p>
                            )}
                          </div>
                        </StickyNote>
                      </div>
                      
                      {/* Instructions */}
                      <StickyNote color="purple" className="p-3 transform rotate-1">
                        <h4 className="font-bold mb-2">Instructions</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm">
                          <li>Use the login details above to access your {trial.serviceName} trial account.</li>
                          <li>If prompted for verification, use the provided phone number and verification code.</li>
                          <li>Your trial is set to expire on the trial end date. Make sure to cancel before then to avoid charges.</li>
                          <li>For security, the payment method details are partially masked.</li>
                        </ol>
                      </StickyNote>
                    </>
                  ) : (
                    <div className="p-4 text-center">
                      <p>No detailed trial data available.</p>
                      <p className="text-sm text-gray-500 mt-1">The trial might be in progress or was generated before detail tracking was added.</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
};

export default CommandArea;
