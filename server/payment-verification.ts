import { storage } from "./storage";
import { userPackages } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { addMonths } from "date-fns";

// Interfaces for payment system
interface PaymentVerificationResult {
  success: boolean;
  message: string;
  data?: any;
}

interface PaymentDetails {
  walletAddress: string;
  transactionId: string;
  amount: number;
}

/**
 * Service to handle payment verification and subscription management
 */
export class PaymentService {
  /**
   * Verify a blockchain transaction
   * In a real implementation, this would connect to a blockchain API
   */
  async verifyTransaction(paymentDetails: PaymentDetails): Promise<PaymentVerificationResult> {
    try {
      // In development/test mode, we'll always approve transactions that have valid format
      const isValidWallet = this.isValidWalletAddress(paymentDetails.walletAddress);
      const isValidTx = this.isValidTransactionId(paymentDetails.transactionId);
      
      if (!isValidWallet) {
        return {
          success: false,
          message: "Invalid wallet address format"
        };
      }
      
      if (!isValidTx) {
        return {
          success: false,
          message: "Invalid transaction ID format"
        };
      }
      
      // For production, we would verify the transaction on the blockchain
      // by connecting to a node or using a service like Etherscan API,
      // checking transaction details, amount, and confirmation status
      
      // For now, just simulate a successful transaction verification
      return {
        success: true,
        message: "Transaction verified successfully",
        data: {
          timestamp: new Date().toISOString(),
          confirmations: 12,
          verifiedAmount: paymentDetails.amount
        }
      };
    } catch (error) {
      console.error("Error verifying transaction:", error);
      return {
        success: false,
        message: "Transaction verification failed due to an error"
      };
    }
  }
  
  /**
   * Check if a wallet address has the correct format
   */
  private isValidWalletAddress(address: string): boolean {
    // Basic validation for Ethereum-style addresses
    // In production, use a proper library or more thorough validation
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
  
  /**
   * Check if a transaction ID has the correct format
   */
  private isValidTransactionId(txId: string): boolean {
    // Basic validation for Ethereum-style transaction hashes
    // In production, use a proper library or more thorough validation
    return /^0x[a-fA-F0-9]{64}$/.test(txId);
  }
  
  /**
   * Check if a user's subscription package has expired
   * Applies only to subscription-based packages (Basic and Premium)
   */
  async checkSubscriptionStatus(userId: number): Promise<{
    isActive: boolean;
    renewalDate: string | null;
    trialsUsed: number;
    trialsRemaining: number;
  }> {
    try {
      // Get user's package
      const userPackage = await storage.getUserPackage(userId);
      
      if (!userPackage) {
        return {
          isActive: false,
          renewalDate: null,
          trialsUsed: 0,
          trialsRemaining: 0
        };
      }
      
      // If not a subscription, always return active if it exists
      if (!userPackage.isSubscription) {
        return {
          isActive: userPackage.isActive,
          renewalDate: null,
          trialsUsed: 0,
          trialsRemaining: userPackage.trialsRemaining
        };
      }
      
      // For subscription packages, check if renewal date has passed
      if (!userPackage.renewalDate) {
        // If no renewal date set, calculate it based on purchase date
        const purchasedAt = new Date(userPackage.purchasedAt);
        const renewalDate = addMonths(purchasedAt, 1).toISOString();
        
        // Update the renewal date in the database
        await db.update(userPackages)
          .set({ renewalDate })
          .where(eq(userPackages.userId, userId))
          .execute();
        
        return {
          isActive: userPackage.isActive,
          renewalDate,
          trialsUsed: userPackage.trialsUsedInCycle || 0,
          trialsRemaining: (userPackage.trialLimitPerCycle || 0) - (userPackage.trialsUsedInCycle || 0)
        };
      }
      
      // Check if renewal date has passed
      const now = new Date();
      const renewalDate = new Date(userPackage.renewalDate);
      
      // If renewal date has passed and not updated, mark as inactive
      const isActive = (userPackage.isActive ?? false) && now < renewalDate;
      
      // Calculate trials used and remaining
      const trialsUsed = userPackage.trialsUsedInCycle || 0;
      const trialsRemaining = (userPackage.trialLimitPerCycle || 0) - trialsUsed;
      
      return {
        isActive,
        renewalDate: userPackage.renewalDate,
        trialsUsed,
        trialsRemaining
      };
    } catch (error) {
      console.error("Error checking subscription status:", error);
      // If there's an error, return inactive status
      return {
        isActive: false,
        renewalDate: null,
        trialsUsed: 0,
        trialsRemaining: 0
      };
    }
  }
  
  /**
   * Get the number of trials used in the current billing cycle
   */
  private async getTrialsUsedThisMonth(userId: number, purchaseDate: Date): Promise<number> {
    try {
      // Get all commands executed by this user in the current billing period
      const userPackage = await storage.getUserPackage(userId);
      
      if (!userPackage) {
        return 0;
      }
      
      return userPackage.trialsUsedInCycle || 0;
    } catch (error) {
      console.error("Error getting trials used this month:", error);
      return 0;
    }
  }
  
  /**
   * Reset subscription account usage when a new billing cycle starts
   */
  async resetMonthlySubscriptionUsage(userId: number): Promise<boolean> {
    try {
      const userPackage = await storage.getUserPackage(userId);
      
      if (!userPackage || !userPackage.isSubscription) {
        return false;
      }
      
      // Reset the trials used in the current cycle
      await storage.resetTrialsUsedInCycle(userPackage.id);
      
      // Calculate new renewal date (1 month from current renewal date)
      const currentRenewalDate = userPackage.renewalDate 
        ? new Date(userPackage.renewalDate) 
        : new Date();
      
      const newRenewalDate = addMonths(currentRenewalDate, 1).toISOString();
      
      // Update the renewal date
      await db.update(userPackages)
        .set({ 
          renewalDate: newRenewalDate,
          isActive: true // Ensure package is marked active after renewal
        })
        .where(eq(userPackages.id, userPackage.id))
        .execute();
      
      return true;
    } catch (error) {
      console.error("Error resetting subscription usage:", error);
      return false;
    }
  }
}

// Export a singleton instance of the service
export const paymentService = new PaymentService();