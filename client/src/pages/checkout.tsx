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
  CreditCard, 
  Calendar, 
  Lock, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2,
  Sparkles
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

const paymentSchema = z.object({
  cardName: z.string().min(3, "Cardholder name is required"),
  cardNumber: z.string().min(16, "Card number must be 16 digits").max(16),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, "Expiry date must be in format MM/YY"),
  cvv: z.string().min(3, "CVV must be 3 digits").max(4),
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
      cardName: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
    },
  });

  const selectedPackage = packages.find(pkg => pkg.id === selectedPackageId);

  const handleSubmit = async (data: PaymentFormData) => {
    if (!selectedPackageId) {
      toast({
        title: "No package selected",
        description: "Please select a package before proceeding",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real app, this would call a secure API to process payment
      // For this demo, we'll just simulate a payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Then purchase the package
      await purchasePackage();
      
      // Show success message
      setIsSuccess(true);
      
      // Reset form
      form.reset();
      
      // Invalidate queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/user/package"] });
      
      // After a delay, redirect to home
      setTimeout(() => {
        setLocation("/");
      }, 3000);
    } catch (error) {
      toast({
        title: "Payment failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format credit card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  // Format expiry date as MM/YY
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    
    return v;
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
                <p className="text-gray-600 mb-6">
                  Your subscription to {selectedPackage?.name} has been activated.
                </p>
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
                        <CreditCard className="mr-2 h-5 w-5" />
                        Payment Details
                      </h2>

                      <FormField
                        control={form.control}
                        name="cardName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cardholder Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Smith" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cardNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Card Number</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="4242 4242 4242 4242" 
                                value={formatCardNumber(field.value)}
                                onChange={e => field.onChange(e.target.value.replace(/\s/g, ""))}
                                maxLength={19}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="expiryDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expiry Date</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="MM/YY" 
                                  value={formatExpiryDate(field.value)}
                                  onChange={e => field.onChange(e.target.value.replace(/\//g, ""))}
                                  maxLength={5}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="cvv"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CVV</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="123" 
                                  type="password" 
                                  maxLength={4}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
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
                            Processing...
                          </>
                        ) : (
                          <>
                            Complete Purchase
                          </>
                        )}
                      </Button>
                      <div className="flex items-center justify-center mt-4 text-xs text-gray-500">
                        <Lock className="h-3 w-3 mr-1" />
                        <span>Secure payment processing</span>
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

                  {selectedPackage?.name.toLowerCase().includes("monthly") && (
                    <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded-md">
                      By completing your purchase, you agree to be billed monthly for this subscription.
                      You can cancel anytime from your account settings.
                    </div>
                  )}
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