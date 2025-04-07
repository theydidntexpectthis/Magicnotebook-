import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { AiTeamMember } from "@shared/schema";

// Mock data for demonstration purposes (when API keys aren't available)
const MOCK_RESPONSES: Record<string, string[]> = {
  "claude-3-7-sonnet-20250219": [
    "I'd be happy to help you brainstorm ideas for your project. Let's approach this creatively!",
    "Based on my analysis of the information you've provided, I have a few suggestions to consider.",
    "That's an interesting perspective! Here's how I would think about this problem...",
    "Looking at the context you've provided, here are some key insights that might be helpful.",
    "I understand your concern. Let me offer some creative solutions that might address this challenge."
  ],
  "gpt-4o": [
    "I've analyzed your code and found several optimization opportunities that could improve performance.",
    "Here's a detailed breakdown of the technical process you asked about, with key considerations highlighted.",
    "Based on the specifications you provided, I've created a solution that meets all the requirements while maintaining efficiency.",
    "Let me explain this complex concept in more straightforward terms to make it easier to understand.",
    "I've identified a potential issue in your approach. Here's a more robust alternative that addresses the edge cases."
  ]
};

interface AiServiceOptions {
  useRealApi: boolean;
}

export class AiService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private useRealApi: boolean;
  
  constructor(options: AiServiceOptions = { useRealApi: false }) {
    this.useRealApi = options.useRealApi;
    
    // Initialize API clients if keys are available and we're using real APIs
    if (this.useRealApi) {
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      }
      
      if (process.env.ANTHROPIC_API_KEY) {
        this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      }
    }
  }
  
  public async generateResponse(
    aiTeamMember: AiTeamMember,
    userPrompt: string,
    chatHistory: { content: string, isUserMessage: boolean }[] = []
  ): Promise<string> {
    // If we're not using real APIs or the API client is not available, return mock data
    if (!this.useRealApi || 
        (aiTeamMember.provider === "openai" && !this.openai) ||
        (aiTeamMember.provider === "anthropic" && !this.anthropic)) {
      return this.generateMockResponse(aiTeamMember.model);
    }
    
    if (aiTeamMember.provider === "openai" && this.openai) {
      return this.generateOpenAiResponse(aiTeamMember, userPrompt, chatHistory);
    } else if (aiTeamMember.provider === "anthropic" && this.anthropic) {
      return this.generateAnthropicResponse(aiTeamMember, userPrompt, chatHistory);
    } else {
      throw new Error(`Unsupported AI provider: ${aiTeamMember.provider}`);
    }
  }
  
  private async generateOpenAiResponse(
    aiTeamMember: AiTeamMember,
    userPrompt: string,
    chatHistory: { content: string, isUserMessage: boolean }[] = []
  ): Promise<string> {
    if (!this.openai) throw new Error("OpenAI client is not initialized");
    
    // Convert chat history to OpenAI message format
    const messages = [
      { role: "system", content: aiTeamMember.systemPrompt },
      ...chatHistory.map(msg => ({
        role: msg.isUserMessage ? "user" : "assistant",
        content: msg.content
      })),
      { role: "user", content: userPrompt }
    ];
    
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      const response = await this.openai.chat.completions.create({
        model: aiTeamMember.model,
        messages: messages as any, // Type casting to avoid TypeScript errors
        temperature: 0.7,
        max_tokens: 800,
      });
      
      return response.choices[0].message.content || "I don't have a response for that.";
    } catch (error: any) {
      console.error("OpenAI API error:", error);
      throw new Error(`Error generating response: ${error.message}`);
    }
  }
  
  private async generateAnthropicResponse(
    aiTeamMember: AiTeamMember,
    userPrompt: string,
    chatHistory: { content: string, isUserMessage: boolean }[] = []
  ): Promise<string> {
    if (!this.anthropic) throw new Error("Anthropic client is not initialized");
    
    // Convert chat history to Anthropic message format
    const typedMessages: Array<{role: "user" | "assistant", content: string}> = [];
    
    // Convert chat history to properly typed messages
    chatHistory.forEach(msg => {
      typedMessages.push({
        role: msg.isUserMessage ? "user" : "assistant",
        content: msg.content
      });
    });
    
    // Add the current user prompt
    typedMessages.push({ role: "user", content: userPrompt });
    
    try {
      // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
      const response = await this.anthropic.messages.create({
        model: aiTeamMember.model,
        system: aiTeamMember.systemPrompt,
        messages: typedMessages,
        max_tokens: 800,
        temperature: 0.7,
      });
      
      // Extract text from content
      let responseText = "I don't have a response for that.";
      if (response.content && response.content.length > 0) {
        const firstContent = response.content[0];
        if ('text' in firstContent) {
          responseText = firstContent.text;
        }
      }
      
      return responseText;
    } catch (error: any) {
      console.error("Anthropic API error:", error);
      throw new Error(`Error generating response: ${error.message}`);
    }
  }
  
  private generateMockResponse(model: string): string {
    const availableResponses = MOCK_RESPONSES[model] || MOCK_RESPONSES["gpt-4o"];
    const randomIndex = Math.floor(Math.random() * availableResponses.length);
    return availableResponses[randomIndex];
  }
}

// Create a singleton instance
export const aiService = new AiService({ useRealApi: false });

// Export function to reinitialize the service with real APIs
export function initializeAiService(useRealApi: boolean = true): void {
  Object.assign(aiService, new AiService({ useRealApi }));
}