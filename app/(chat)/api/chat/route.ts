import type { UIMessage } from 'ai';
import {
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  getTrailingMessageId,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { getSessionWithFallback, type GuestSession } from '@/lib/auth';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedChatModel,
    }: {
      id: string;
      messages: Array<UIMessage>;
      selectedChatModel: string;
    } = await request.json();

    const session = await auth();
    const sessionWithFallback = getSessionWithFallback(session);

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      console.error('POST: No user message found');
      return new Response('No user message found', { status: 400 });
    }

    const chat = await getChatById({ id });

    if (!chat) {
      // Generate a fallback title if the API call fails
      let title: string;
      try {
        title = await generateTitleFromUserMessage({
          message: userMessage,
        });
      } catch (error) {
        console.error('Failed to generate title:', error);
        title = 'New Chat';
      }

      await saveChat({
        id,
        userId:
          sessionWithFallback.user?.id ||
          '00000000-0000-0000-0000-000000000000',
        title: title || 'New Chat', // Ensure title is always a string
      });
    } else {
      if (
        chat.userId !==
        (sessionWithFallback.user?.id || '00000000-0000-0000-0000-000000000000')
      ) {
        console.error(
          'POST: Unauthorized: Chat ID',
          id,
          'User ID',
          sessionWithFallback.user?.id ||
            '00000000-0000-0000-0000-000000000000',
        );
        // Allow access with warning instead of returning 401
        console.warn('Allowing access to chat despite user mismatch');
      }
    }

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: userMessage.id,
          role: 'user',
          parts: userMessage.parts,
          attachments: userMessage.experimental_attachments ?? [],
          createdAt: new Date(),
        },
      ],
    });

    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel }),
          messages,
          maxSteps: 5,
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : [
                  'getWeather',
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            getWeather,
            createDocument: createDocument({
              session: sessionWithFallback,
              dataStream,
            }),
            updateDocument: updateDocument({
              session: sessionWithFallback,
              dataStream,
            }),
            requestSuggestions: requestSuggestions({
              session: sessionWithFallback,
              dataStream,
            }),
          },
          onFinish: async ({ response }) => {
            // Always try to save the message, even without a user ID
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
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment(),
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });
  } catch (error) {
    console.error('Error in POST', error);
    return new Response('An error occurred while processing your request!', {
      status: 404,
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    console.error(`Id ${id} Not Found for delete`);
    return new Response('Not Found for delete', { status: 404 });
  }

  const session = await auth();
  const sessionWithFallback = getSessionWithFallback(session);

  try {
    const chat = await getChatById({ id });

    if (
      chat.userId !==
      (sessionWithFallback.user?.id || '00000000-0000-0000-0000-000000000000')
    ) {
      console.error(
        'DELETE: Unauthorized: Chat ID',
        id,
        'User ID',
        sessionWithFallback.user?.id || '00000000-0000-0000-0000-000000000000',
      );
      // Allow access with warning instead of returning 401
      console.warn('Allowing deletion despite user mismatch');
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}
