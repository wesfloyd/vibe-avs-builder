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
import { isProductionEnvironment } from '@/lib/constants';
import { logContentForDebug } from '@/lib/utils/debugUtils';
import { executeChatStream } from '@/lib/ai/chat-stream-executor';
import { ChatAnthropic } from "@langchain/anthropic";


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




    const llm = new ChatAnthropic({
      model: "claude-3-7-sonnet-latest",
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    
    const stream = await llm.stream("pick a random number between 1 and 10, then make a quick joke about it");

    return LangChainAdapter.toDataStreamResponse(stream);


    

    /**
    // Determine the system prompt based on intent *before* starting the stream execution
    // Todo: move this to langchain
    let systemPrompt = systemPromptDefault({ selectedChatModel });
    
    const dataStreamResponse = createDataStreamResponse({
      execute: (dataStream) => {
        executeChatStream({ dataStream, session, messages, selectedChatModel, systemPrompt, userMessage, id, isProductionEnvironment });
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });

    return dataStreamResponse;
 */

    
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
