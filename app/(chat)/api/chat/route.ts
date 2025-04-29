import type { UIMessage } from 'ai';
import {
  createDataStreamResponse,
  LangChainAdapter,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { systemPromptDefault } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  getMostRecentUserMessage,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { logContentForDebug } from '@/lib/utils/debugUtils';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { modelFullStreaming, modelLiteGenerative } from '@/lib/ai/providers';
import { UserIntent, classifyUserIntent } from '@/lib/ai/intentManager';



  
// Second LLM: generate poem
async function generatePoem(messages: UIMessage[], intent: UserIntent) {
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


    
    try {
      // Todo: move logic to external file
      const intent = await classifyUserIntent(messages);
      // Todo: modify to invoke conditional logic based on intent
      const stream = await generatePoem(messages, intent);
      
      return LangChainAdapter.toDataStreamResponse(stream);
    } catch (error) {
      console.error('Error processing AI response:', error);
      return new Response('Error generating response', { status: 500 });
    }
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
