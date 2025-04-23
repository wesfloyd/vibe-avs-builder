import type { UIMessage } from 'ai';
import type { Session } from 'next-auth';
import { streamText, smoothStream, appendResponseMessages } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import {
  generateUUID,
  getTrailingMessageId,
} from '@/lib/utils';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { saveMessages } from '@/lib/db/queries';
import { logContentForDebug } from '@/lib/utils/debugUtils';

interface ExecuteChatStreamParams {
  dataStream: any; // Using 'any' for now as CoreDataStream seems incorrect
  session: Session;
  messages: UIMessage[];
  selectedChatModel: string;
  systemPromptForExecution: string;
  userMessage: UIMessage;
  id: string; // chat id
  isProductionEnvironment: boolean;
}

export async function executeDefaultChatStream({
  dataStream,
  session,
  messages,
  selectedChatModel,
  systemPromptForExecution,
  userMessage,
  id,
  isProductionEnvironment,
}: ExecuteChatStreamParams) {
   console.log('Initiating executeDefaultChatStream');
  const result = streamText({
    model: myProvider.languageModel(selectedChatModel),
    system: systemPromptForExecution, // Use the pre-determined system prompt
    messages,// This contains the full conversation history
    maxSteps: 5,
    experimental_activeTools:
      selectedChatModel === 'chat-model-reasoning'
        ? []
        : [
            'createDocument',
            'updateDocument',
            'requestSuggestions',
            //'refineIdea',
          ],
    experimental_transform: smoothStream({ chunking: 'word' }),
    experimental_generateMessageId: generateUUID,
    tools: {
      createDocument: createDocument({ session, dataStream }),
      updateDocument: updateDocument({ session, dataStream }),
      requestSuggestions: requestSuggestions({
        session,
        dataStream,
      }),
      //refineIdea,
    },
    onFinish: async ({ response }) => {
      if (session.user?.id) {
        try {
          const assistantId = getTrailingMessageId({
            messages: response.messages.filter(
              (message) => message.role === 'assistant',
            ),
          });

          if (!assistantId) {
            throw new Error('No assistant message found!');
          }

          const [, assistantMessage] = appendResponseMessages({
            messages: [userMessage],
            responseMessages: response.messages,
          });

          await saveMessages({
            messages: [
              {
                id: assistantId,
                chatId: id,
                role: assistantMessage.role,
                parts: assistantMessage.parts,
                attachments:
                  assistantMessage.experimental_attachments ?? [],
                createdAt: new Date(),
              },
            ],
          });
        } catch (_) {
          console.error('Failed to save chat');
        }
      }
    },
    experimental_telemetry: {
      isEnabled: isProductionEnvironment,
      functionId: 'stream-text',
    },
  });

  // Log the raw LLM response and usage
  result.usage.then(usage => {
    console.log('Result Usage Prompt Tokens:', usage.promptTokens);
  });

  // This is where the AI response is consumed
  result.consumeStream();

  // This is where the AI response is merged into the data stream
  result.mergeIntoDataStream(dataStream, {
    sendReasoning: true,
  });
} 





export async function executeStage3PrototypeChatStream({
  dataStream,
  session,
  messages,
  selectedChatModel,
  systemPromptForExecution,
  userMessage,
  id,
  isProductionEnvironment,
}: ExecuteChatStreamParams) {
  console.log('Initiating executeStage3PrototypeChatStream');
  const result = streamText({
    model: myProvider.languageModel(selectedChatModel),
    system: systemPromptForExecution, // Use the pre-determined system prompt
    messages,// This contains the full conversation history
    maxSteps: 5,
    
    experimental_transform: smoothStream({ chunking: 'word' }),
    experimental_generateMessageId: generateUUID,
    
    onFinish: async ({ response }) => {
      if (session.user?.id) {
        try {
          const assistantId = getTrailingMessageId({
            messages: response.messages.filter(
              (message) => message.role === 'assistant',
            ),
          });

          if (!assistantId) {
            throw new Error('No assistant message found!');
          }

          const [, assistantMessage] = appendResponseMessages({
            messages: [userMessage],
            responseMessages: response.messages,
          });

          await saveMessages({
            messages: [
              {
                id: assistantId,
                chatId: id,
                role: assistantMessage.role,
                parts: assistantMessage.parts,
                attachments:
                  assistantMessage.experimental_attachments ?? [],
                createdAt: new Date(),
              },
            ],
          });
        } catch (_) {
          console.error('Failed to save chat');
        }
      }
    },
    experimental_telemetry: {
      isEnabled: isProductionEnvironment,
      functionId: 'stream-text',
    },
  });

  // Log the raw LLM response and usage
  result.usage.then(usage => {
    console.log('Result Usage Prompt Tokens:', usage.promptTokens);
  });
  
  
  result.reasoning.then(reasoning => {
    console.log('Raw LLM Reasoning:', reasoning);
  });

  result.text.then(async (text) => {
    console.log('Raw LLM Response:', text);
    await logContentForDebug(text, `raw-llm-response.txt`, 'Chat Stream Executor - Stage 3');
  });

  // This is where the AI response is consumed
  result.consumeStream();

  // This is where the AI response is merged into the data stream
  result.mergeIntoDataStream(dataStream, {
    sendReasoning: true,
  });
} 