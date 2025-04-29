import type { UIMessage } from 'ai';
import type { Session } from 'next-auth';
import { streamText, smoothStream, appendResponseMessages } from 'ai';
import { modelFullStreaming, myProvider } from '@/lib/ai/providers';
import {
  generateUUID,
  getTrailingMessageId,
} from '@/lib/utils';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { saveMessages } from '@/lib/db/queries';
import { logContentForDebug } from '@/lib/utils/debugUtils';
import { HumanMessage } from '@langchain/core/messages';
import { SystemMessage } from '@langchain/core/messages';

interface ExecuteChatStreamParams {
  dataStream: any; // Using 'any' for now as CoreDataStream seems incorrect
  session: Session;
  messages: UIMessage[];
  selectedChatModel: string;
  systemPrompt: string;
  userMessage: UIMessage;
  id: string; // chat id
  isProductionEnvironment: boolean;
}


export async function generateLLMResponse(messages: UIMessage[], intent: string) {
  const chat = modelFullStreaming;

  const systemPrompt = `
    I'll help you respond to the user's request about ${intent}.
    First, I'll briefly acknowledge their intent is classified as ${intent}.
    Then, I'll create a short 3-line poem that reflects their message and this intent.
    Keep the response focused and creative.
      `;

  // Focus on the most recent user message for poem generation
  const userText = messages.slice(-1).map(m => m.content).join("\n");


  try {
    return chat.stream([
      new SystemMessage(systemPrompt),
      new HumanMessage(userText)
    ]);
  } catch (error) {
    console.error("Poem generation failed:", error);
    throw error; // Rethrow to be handled by the POST handler
  }
}

// export async function executeChatStream({
//   dataStream,
//   session,
//   messages,
//   selectedChatModel,
//   systemPrompt,
//   userMessage,
//   id,
//   isProductionEnvironment,
// }: ExecuteChatStreamParams) {
   
//   const result = streamText({
//     model: myProvider.languageModel(selectedChatModel),
//     system: systemPrompt, // Use the pre-determined system prompt
//     messages,// This contains the full conversation history
//     maxSteps: 5,
//     experimental_transform: smoothStream({ chunking: 'word' }),
//     experimental_generateMessageId: generateUUID,
//     tools: {
//       // no tools for now
//     },
//     onFinish: async ({ response }) => {
//       if (session.user?.id) {
//         try {
//           const assistantId = getTrailingMessageId({
//             messages: response.messages.filter(
//               (message) => message.role === 'assistant',
//             ),
//           });

//           if (!assistantId) {
//             throw new Error('No assistant message found!');
//           }

//           const [, assistantMessage] = appendResponseMessages({
//             messages: [userMessage],
//             responseMessages: response.messages,
//           });

//           await saveMessages({
//             messages: [
//               {
//                 id: assistantId,
//                 chatId: id,
//                 role: assistantMessage.role,
//                 parts: assistantMessage.parts,
//                 attachments:
//                   assistantMessage.experimental_attachments ?? [],
//                 createdAt: new Date(),
//               },
//             ],
//           });
//         } catch (_) {
//           console.error('Failed to save chat');
//         }
//       }
//     },
//     experimental_telemetry: {
//       isEnabled: isProductionEnvironment,
//       functionId: 'stream-text',
//     },
//   });

//   result.text.then(async (text) => {
    
//     await logContentForDebug(text, `raw-llm-response.txt`, 'Chat Stream Executor - Stage 3');
//   });

//   // This is where the AI response is consumed
//   result.consumeStream();

//   // This is where the AI response is merged into the data stream
//   result.mergeIntoDataStream(dataStream, {
//     sendReasoning: true,
//   });
// } 


