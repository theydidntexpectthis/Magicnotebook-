import { trialOrchestrator, TrialType } from './fixed-orchestrator';
import { storage } from '../storage';

/**
 * Executes a trial generation command and records the result
 * @param userId The ID of the user requesting the trial
 * @param command The command string (e.g., "!generateTrial netflix")
 * @returns The result of the trial generation process
 */
export async function executeTrialCommand(userId: number, command: string) {
  console.log(`Executing trial command for user ${userId}: ${command}`);
  
  // Parse the command to extract service name and any parameters
  const commandRegex = /^(!)?generateTrial\s+([a-zA-Z0-9]+)(\s+(.+))?$/;
  const match = command.match(commandRegex);
  
  if (!match) {
    const execution = await storage.executeCommand({
      userId,
      command,
      serviceName: "unknown",
      status: "error",
      message: "Invalid command format. Use: !generateTrial [serviceName]",
      executedAt: new Date().toISOString()
    });
    
    return execution;
  }
  
  const serviceName = match[2];
  const paramsString = match[4] || '';
  
  // Parse any additional parameters (if provided)
  let parameters: Record<string, any> = {};
  try {
    if (paramsString) {
      // Try to parse as JSON if it starts with { and ends with }
      if (paramsString.trim().startsWith('{') && paramsString.trim().endsWith('}')) {
        parameters = JSON.parse(paramsString);
      } else {
        // Otherwise, parse as key=value pairs
        paramsString.split(' ').forEach(param => {
          const [key, value] = param.split('=');
          if (key && value) {
            parameters[key] = value;
          }
        });
      }
    }
  } catch (error: any) {
    console.error('Error parsing parameters:', error);
  }
  
  try {
    // Check if user has an active package with trials remaining
    const userPackage = await storage.getUserPackage(userId);
    
    if (!userPackage) {
      return await storage.executeCommand({
        userId,
        command,
        serviceName,
        status: "error",
        message: "You need an active package to generate trials",
        executedAt: new Date().toISOString()
      });
    }
    
    if (userPackage.trialsRemaining === 0) {
      return await storage.executeCommand({
        userId,
        command,
        serviceName,
        status: "error",
        message: "You have no trials remaining. Please upgrade your package.",
        executedAt: new Date().toISOString()
      });
    }
    
    const isUnlimited = userPackage.trialsRemaining === -1;
    
    // Execute the trial generation process
    const trialResult = await trialOrchestrator.generateTrial({
      trialType: TrialType.SUBSCRIPTION, // Default type
      serviceName,
      parameters,
      userId
    });
    
    // Record the command execution result
    const execution = await storage.executeCommand({
      userId,
      command,
      serviceName,
      status: trialResult.success ? "success" : "error",
      message: trialResult.message,
      executedAt: new Date().toISOString()
    });
    
    // If successful and not unlimited trials, decrement the remaining trials
    if (trialResult.success && !isUnlimited) {
      await storage.updateUserPackageTrials(
        userPackage.id,
        userPackage.trialsRemaining - 1
      );
    }
    
    // Create a note with the trial details if successful
    if (trialResult.success && trialResult.data) {
      // Format the trial data as a markdown note
      const trialDetails = formatTrialDetailsAsMarkdown(serviceName, trialResult.data);
      
      // Create a new note with the trial details
      await storage.createNote({
        userId,
        title: `${serviceName} Trial Details`,
        content: trialDetails,
        color: "green", // Use green for successful trials
        isPinned: true, // Pin it so it's easily visible
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return {
      ...execution,
      trialData: trialResult.success ? trialResult.data : null
    };
  } catch (error: any) {
    console.error('Trial command execution failed:', error);
    
    return await storage.executeCommand({
      userId,
      command,
      serviceName,
      status: "error",
      message: `Failed to generate trial: ${error?.message || 'Unknown error'}`,
      executedAt: new Date().toISOString()
    });
  }
}

/**
 * Format trial details as markdown for user-friendly display
 */
function formatTrialDetailsAsMarkdown(serviceName: string, data: any): string {
  const now = new Date().toLocaleDateString();
  
  let markdown = `# ${serviceName} Trial - Generated ${now}\n\n`;
  
  // Add account details section
  markdown += `## Account Details\n\n`;
  
  if (data.accountDetails) {
    markdown += `- **Username:** ${data.accountDetails.username || 'N/A'}\n`;
    markdown += `- **Email:** ${data.accountDetails.email || 'N/A'}\n`;
    markdown += `- **Membership Level:** ${data.accountDetails.membershipLevel || 'Trial'}\n`;
  }
  
  // Add profile information if available
  if (data.profile) {
    markdown += `\n## Profile Information\n\n`;
    markdown += `- **Name:** ${data.profile.firstName} ${data.profile.lastName}\n`;
    
    if (data.profile.age) {
      markdown += `- **Age:** ${data.profile.age}\n`;
    }
    
    if (data.profile.occupation) {
      markdown += `- **Occupation:** ${data.profile.occupation}\n`;
    }
    
    if (data.profile.interests && Array.isArray(data.profile.interests)) {
      markdown += `- **Interests:** ${data.profile.interests.join(', ')}\n`;
    }
  }
  
  // Add contact information if available
  markdown += `\n## Contact Information\n\n`;
  
  if (data.email) {
    markdown += `- **Email Address:** ${data.email.email}\n`;
    markdown += `- **Email Access Key:** ${data.email.accessKey}\n`;
    markdown += `- **Email Expires:** ${data.email.expiresIn} from generation time\n`;
  }
  
  if (data.phone) {
    markdown += `- **Phone Number:** ${data.phone.phoneNumber}\n`;
    markdown += `- **Verification Code:** ${data.phone.verificationCode}\n`;
    markdown += `- **Phone Expires:** ${data.phone.expiresIn} from generation time\n`;
  }
  
  // Add payment information if available (limited details for security)
  if (data.paymentMethod) {
    markdown += `\n## Payment Information\n\n`;
    markdown += `- **Payment Type:** ${data.paymentMethod.type}\n`;
    markdown += `- **Card Last 4:** ${data.paymentMethod.last4}\n`;
    markdown += `- **Expiry:** ${data.paymentMethod.expiryMonth}/${data.paymentMethod.expiryYear}\n`;
  }
  
  // Add trial status information
  markdown += `\n## Trial Status\n\n`;
  markdown += `- **Signup Time:** ${data.signupTime || now}\n`;
  
  if (data.trialEndDate) {
    markdown += `- **Trial End Date:** ${data.trialEndDate}\n`;
  }
  
  // Add instructions for using the trial
  markdown += `\n## Instructions\n\n`;
  markdown += `1. Use the login details above to access your ${serviceName} trial account.\n`;
  markdown += `2. If prompted for verification, use the provided phone number and verification code.\n`;
  markdown += `3. Your trial is set to expire on the trial end date. Make sure to cancel before then to avoid charges.\n`;
  markdown += `4. For security, the payment method details are partially masked.\n`;
  
  return markdown;
}