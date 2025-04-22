import { generateObject } from 'ai';
import { z } from 'zod';
import { myProvider } from './providers';

export type UserIntent = 'Idea' | 'Design' | 'Prototype' | 'Other';

/**
 * Infers the user's intent based on their message content.
 *
 * @param userMessageContent The content of the user's message
 * @param selectedChatModel The model to use for inference
 * @returns The inferred user intent
 */
export async function inferUserIntent(
  userMessageContent: string,
  selectedChatModel: string,
): Promise<UserIntent> {
  const { object: intentResult } = await generateObject({
    model: myProvider.languageModel(selectedChatModel),
    schema: z.object({
      intent: z
        .enum(['Idea', 'Design', 'Prototype', 'Other'])
        .describe(
          "The user's likely intent: refining an Idea, generating a Design Tech Spec, generating Prototype code, or Other.",
        ),
    }),
    system: `Review the user's prompt and determine their primary intent. Choose one of: Idea, Design, Prototype, or Other.`,
    prompt: userMessageContent,
  });

  return intentResult.intent;
}
