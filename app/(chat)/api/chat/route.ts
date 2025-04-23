import type { UIMessage } from 'ai';
import {
  appendResponseMessages,
  createDataStreamResponse,
  generateText,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { systemPromptDefault, stage1IdeasPrompt, stage2DesignPrompt, stage3PrototypePrompt, artifactsPrompt } from '@/lib/ai/prompts';
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
//import { refineIdea } from '@/lib/ai/tools/refine-idea';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { inferUserIntent } from '@/lib/ai/intentManager';
import { text } from 'stream/consumers';

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

    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      console.error('No user message found');
      return new Response('No user message found', { status: 400 });
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });

      await saveChat({ id, userId: session.user.id, title });
    } else {
      if (chat.userId !== session.user.id) {
        return new Response('Unauthorized', { status: 401 });
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

    // Infer the user's current intent
    const likelyIntent = await inferUserIntent(
      userMessage.content,
      selectedChatModel,// todo: modify this to use a minimal fast model?
    );
    console.log('Inferred user intent:', likelyIntent);
    

    // Determine the system prompt based on intent *before* starting the stream execution
    let systemPromptForExecution = systemPromptDefault({ selectedChatModel });
    if (likelyIntent === 'Idea') {
      // Append the stage 1 ideas prompt to the system prompt
      systemPromptForExecution += await stage1IdeasPrompt(); 
    } else if (likelyIntent === 'Design') {
      // Append the stage 2 design prompt to the system prompt
      systemPromptForExecution += await stage2DesignPrompt();
    } else if (likelyIntent === 'Prototype') {
      // Append the stage 3 prototype prompt to the system prompt
      systemPromptForExecution = await stage3PrototypePrompt();
    }
    
    // todo: find a method to better log the full systemPromptForExecution string for better debugging
    // todo: further testing on whether to include artifacts prompt or not for stage 1 and 2
    // todo: lots more work to do to determine whether the current tool -> createDocument -> additional LLM calls approach will work.

    console.log('systemPromptForExecution char count: ', systemPromptForExecution.length);
    console.log('systemPromptForExecution token count should be approx 3.5x the char count, which is ', systemPromptForExecution.length * 3.5);



    // Todo: modify so that Stage 3 is sent to claude 3.7 sonnet, rather than the default datastream.
    // consider modifying only the selectedChatModel variable before invoking this

    // Todo: modify to move this code into a function in a separate file, and call that function from the default datastream and stage 3 datastream.

    // This is where the response from the AI provider is generated
    return createDataStreamResponse({
      execute: (dataStream) => {
        // This is where the AI response is invoked

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
        
        
        result.reasoning.then(reasoning => {
          console.log('Raw LLM Reasoning:', reasoning);
        });

        result.text.then(text => {
          console.log('Raw LLM Response:', text);
        });

        // This is where the AI response is consumed
        result.consumeStream();

        // This is where the AI response is merged into the data stream
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

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
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
