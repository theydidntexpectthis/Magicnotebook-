import React, { useState, useEffect } from "react";
import { useUser } from "@/context/user-context";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { StickyNote } from "@/components/ui/sticky-note";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Wallet, 
  QrCode, 
  Copy, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2,
  Sparkles,
  HelpCircle
} from "lucide-react";
import { useLocation } from "wouter";
import Header from "@/components/header";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { queryClient } from "@/lib/queryClient";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const paymentSchema = z.object({
  walletAddress: z.string().min(20, "Wallet address is required"),
  paymentId: z.string().min(5, "Payment ID/transaction hash is required"),
  email: z.string().email("A valid email is required for receipt").optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const Checkout: React.FC = () => {
  const { 
    packages, 
    selectedPackageId, 
    setSelectedPackageId, 
    purchasePackage, 
    isPurchasing,
    userPackage
  } = useUser();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [autoDeliver, setAutoDeliver] = useState(true);

  // Get package ID from URL if available
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const packageId = params.get("package");
    if (packageId && !isNaN(Number(packageId))) {
      setSelectedPackageId(Number(packageId));
    } else if (!selectedPackageId && packages.length > 0) {
      // Default to the first package if none is selected
      setSelectedPackageId(packages[0].id);
    }
  }, [packages, selectedPackageId, setSelectedPackageId]);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      walletAddress: "",
      paymentId: "",
      email: user?.email || "",
    },
  });

  const selectedPackage = packages.find(pkg => pkg.id === selectedPackageId);
  
  // Verify wallet transaction - In a real app this would connect to blockchain
  const verifyTransaction = async (walletAddress: string, txHash: string, amount: number) => {
    console.log(`Verifying transaction from ${walletAddress} with hash ${txHash} for amount $${amount}`);
    // In a real implementation, this would check the blockchain for the transaction
    // For demo purposes, we'll just return true after a delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For a real implementation, we'd check:
    // 1. If the transaction exists on the blockchain
    // 2. If the amount matches the expected amount
    // 3. If the transaction is confirmed (enough blocks)
    // 4. If the transaction hasn't been used for a previous purchase
    
    return true;
  };

  const handleSubmit = async (data: PaymentFormData) => {
    if (!selectedPackageId || !selectedPackage) {
      toast({
        title: "No package selected",
        description: "Please select a package before proceeding",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Verify the transaction on the blockchain
      toast({
        title: "Verifying payment",
        description: "Please wait while we verify your transaction...",
      });
      
      const isVerified = await verifyTransaction(
        data.walletAddress,
        data.paymentId,
        selectedPackage.price / 100
      );
      
      if (!isVerified) {
        throw new Error("Transaction verification failed. Please check your payment details and try again.");
      }
      
      // Call the API to activate the package
      await purchasePackage();
      
      // If auto-deliver is enabled, generate trials immediately
      if (autoDeliver && selectedPackage.trialCount > 0) {
        try {
          // In a real app, this would call an API to generate trials
          toast({
            title: "Generating trials",
            description: `Auto-delivering ${selectedPackage.trialCount} trials to your account...`,
          });
          
          // Simulate trial generation - in a real app this would be an API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          toast({
            title: "Trials delivered",
            description: `${selectedPackage.trialCount} trials have been added to your account`,
            variant: "default",
          });
        } catch (error) {
          console.error("Error auto-delivering trials:", error);
          toast({
            title: "Trial delivery notice",
            description: "We couldn't auto-deliver your trials. You can generate them manually from your dashboard.",
            variant: "destructive",
          });
        }
      }
      
      // Show success message
      setIsSuccess(true);
      
      // Send email receipt if provided
      if (data.email) {
        // In a real app, this would call an API to send a receipt
        console.log(`Sending receipt to ${data.email}`);
      }
      
      // Reset form
      form.reset();
      
      // Invalidate queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/user/package"] });
      
      // After a delay, redirect to dashboard
      setTimeout(() => {
        setLocation("/app");
      }, 3000);
    } catch (error) {
      toast({
        title: "Payment verification failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Please log in to continue</h1>
        <Button onClick={() => setLocation("/auth")}>
          Go to Login
        </Button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto pt-2">
          <div className="container mx-auto px-4 py-8 max-w-screen-md">
            <StickyNote color="green" className="p-6 transform rotate-1">
              <div className="text-center py-10">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                <p className="text-gray-600 mb-4">
                  Your subscription to {selectedPackage?.name} has been activated.
                </p>
                {selectedPackage?.trialCount > 0 && autoDeliver && (
                  <div className="bg-green-50 border border-green-100 rounded-md p-3 mb-4 inline-block mx-auto">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-green-700">
                        {selectedPackage.trialCount} trials auto-delivered
                      </span>
                    </div>
                  </div>
                )}
                <Sparkles className="h-8 w-8 text-amber-500 mx-auto mb-4" />
                <p className="text-sm text-gray-500">Redirecting you to the dashboard...</p>
              </div>
            </StickyNote>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 overflow-x-hidden overflow-y-auto pt-2">
        <div className="container mx-auto px-4 py-8 max-w-screen-xl">
          <Button 
            variant="ghost" 
            className="mb-4" 
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Payment Form */}
            <div className="md:col-span-2">
              <StickyNote color="blue" className="p-5 transform rotate-1">
                <h1 className="text-2xl font-semibold mb-4">Complete Your Purchase</h1>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <h2 className="text-lg font-medium flex items-center">
                        <Wallet className="mr-2 h-5 w-5" />
                        Wallet-to-Wallet Payment
                      </h2>

                      <div className="bg-primary/5 border border-primary/20 rounded-md p-4 mb-4">
                        <div className="flex items-center mb-2">
                          <QrCode className="h-5 w-5 mr-2 text-primary" />
                          <h3 className="text-base font-medium">Our Payment Wallet</h3>
                        </div>
                        <div className="flex items-center gap-2 bg-white p-2 rounded border">
                          <code className="flex-1 text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                            0xMN23456789ABCDEF0123456789ABCDEF01234567
                          </code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText("0xMN23456789ABCDEF0123456789ABCDEF01234567");
                              toast({
                                title: "Copied to clipboard",
                                duration: 2000,
                              });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Send the exact amount ${(selectedPackage ? selectedPackage.price / 100 : 0).toFixed(2)} to this wallet 
                          address and enter your transaction details below.
                        </p>
                      </div>

                      <FormField
                        control={form.control}
                        name="walletAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              Your Wallet Address
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full">
                                      <HelpCircle className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs text-xs">The wallet address you used to send the payment</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="0x1234..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="paymentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              Transaction ID/Hash
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full">
                                      <HelpCircle className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs text-xs">The transaction ID or hash from your wallet after sending payment</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="abc123..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email for Receipt (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="your@email.com" 
                                type="email"
                                value={field.value || ''} 
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isSubmitting}
                        size="lg"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying Payment...
                          </>
                        ) : (
                          <>
                            Confirm Payment & Activate Package
                          </>
                        )}
                      </Button>
                      <div className="flex items-center justify-center mt-4 text-xs text-gray-500">
                        <QrCode className="h-3 w-3 mr-1" />
                        <span>Payment will be verified on the blockchain</span>
                      </div>
                    </div>
                  </form>
                </Form>
              </StickyNote>
            </div>

            {/* Order Summary */}
            <div className="md:col-span-1">
              <StickyNote color="yellow" className="p-5 transform -rotate-1">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-500">Select Package</Label>
                    <RadioGroup 
                      value={selectedPackageId?.toString()} 
                      onValueChange={(value) => setSelectedPackageId(Number(value))}
                      className="space-y-3"
                    >
                      {packages.map((pkg) => (
                        <div 
                          key={pkg.id}
                          className={`flex items-center justify-between p-3 border rounded-md ${
                            selectedPackageId === pkg.id 
                              ? 'border-primary bg-primary/5' 
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value={pkg.id.toString()} id={`pkg-${pkg.id}`} />
                            <Label htmlFor={`pkg-${pkg.id}`} className="cursor-pointer">
                              <div className="font-medium">{pkg.name}</div>
                              <div className="text-sm text-gray-500">
                                {pkg.trialCount === -1 
                                  ? "Unlimited trials" 
                                  : `${pkg.trialCount} trial${pkg.trialCount !== 1 ? 's' : ''}`}
                              </div>
                            </Label>
                          </div>
                          <div className="font-semibold">${(pkg.price / 100).toFixed(2)}</div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <Separator />

                  <div className="py-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Subtotal</span>
                      <span>${(selectedPackage ? selectedPackage.price / 100 : 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tax</span>
                      <span>$0.00</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${(selectedPackage ? selectedPackage.price / 100 : 0).toFixed(2)}</span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {selectedPackage?.name.toLowerCase().includes("monthly") && (
                      <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded-md">
                        By completing your purchase, you agree to be billed monthly for this subscription.
                        You can cancel anytime from your account settings.
                      </div>
                    )}
                    
                    <div className="bg-primary/5 border border-primary/20 rounded-md p-3">
                      <h3 className="text-sm font-medium mb-2">Delivery Options</h3>
                      <div className="flex items-start gap-2">
                        <input 
                          type="checkbox" 
                          id="autoDeliver" 
                          className="mt-1"
                          checked={autoDeliver}
                          onChange={(e) => setAutoDeliver(e.target.checked)}
                        />
                        <label htmlFor="autoDeliver" className="text-xs">
                          <div className="font-medium">Auto-deliver all trials upon purchase</div>
                          <div className="text-gray-500">
                            Your trials will be automatically added to your account and ready for immediate use.
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </StickyNote>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;