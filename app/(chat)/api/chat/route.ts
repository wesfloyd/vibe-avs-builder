import type { UIMessage } from 'ai';
import {
  LangChainAdapter,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
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
import { classifyUserIntent } from '@/lib/ai/intentManager';
import { UserIntent } from '@/lib/ai/types';
import { generateLLMResponse } from '@/lib/ai/chat-stream-executor';
import { processStreamInBackground } from '@/lib/utils/backgroundProcessor';
import { logStreamForDebug } from '@/lib/utils/debugUtils';



export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedChatModel,
      initialIntent,
    }: {
      id: string;
      messages: Array<UIMessage>;
      selectedChatModel: string;
      initialIntent?: UserIntent;
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


    // Note: primary LLM backend invocation starts here.
    try {
      const stream = await generateLLMResponse(messages, selectedChatModel, initialIntent);
      
      // Clone the stream for background processing
      const [streamForResponse, streamForBackground] = stream.tee();
      
      // Start background processing without waiting for it to complete
      // Uses the userId from session for SSE messages
      processStreamInBackground(
        streamForBackground, 
        session.user.id,
        id
      ).catch(err => {
        console.error('Background processing error:', err);
      });
      
    
      return LangChainAdapter.toDataStreamResponse(streamForResponse, {
        init: {
          headers: {
            'Content-Type': 'text/event-stream',
          }
        },
      });
    } catch (error) {
      console.error('Error generating response:', error);
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
