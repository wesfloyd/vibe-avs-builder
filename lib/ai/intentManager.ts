import { z } from 'zod';
import { myProvider } from './providers';
import { modelLiteGenerative } from '@/lib/ai/providers';
import type { UIMessage } from 'ai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

export enum UserIntent {
  RefineIdea = "RefineIdea",
  GenerateDesign = "GenerateDesign",
  BuildPrototype = "BuildPrototype",
  Other = "Other"
}

// Schema for the intent classification output
const IntentClassificationSchema = z.object({
  intent: z.enum([
    UserIntent.RefineIdea,
    UserIntent.GenerateDesign, 
    UserIntent.BuildPrototype,
    UserIntent.Other
  ]).describe("The classified intent of the user's messages")
});

// First LLM: classify intent
export async function classifyUserIntent(messages: UIMessage[]): Promise<UserIntent> {

  // Create a model with structured output
  const structuredModel = modelLiteGenerative.withStructuredOutput(IntentClassificationSchema);

  const systemPrompt = `
    You are a classifier.
    Given the user's recent messages, determine:
    1) Refine idea
    2) Generate design
    3) Build prototype code
    4) Other
    Classify the intent based on the conversation.
  `;

  // Only use the last few messages for intent classification to improve efficiency
  const recentMessages = messages.slice(-3);
  const userText = recentMessages.map(m => m.content).join("\n");

  try {
    const result = await structuredModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userText)
    ]);

    // Result is already structured according to our schema
    return result.intent;
  } catch (error) {
    console.error("Intent classification failed:", error);
    return UserIntent.Other; // Fallback to Other on error
  }
}
