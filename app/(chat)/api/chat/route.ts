import type { UIMessage } from 'ai';
import {
  createDataStreamResponse,
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
  getMostRecentUserMessage,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { inferUserIntent } from '@/lib/ai/intentManager';
import { text } from 'stream/consumers';
import { logContentForDebug } from '@/lib/utils/debugUtils';
import { executeDefaultChatStream, executeEnhancedChatStream, executeStage3PrototypeChatStream } from '@/lib/ai/chat-stream-executor';


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

    // Todo: set a default chat model here rather than consuming from selectedChatModel (normal vs reasoning)?

    // Determine the system prompt based on intent *before* starting the stream execution
    let systemPromptForExecution = systemPromptDefault({ selectedChatModel });

    // Log the system prompt for debugging in development
    await logContentForDebug(systemPromptForExecution, `system-prompt-log.txt`, 'Chat API');

    const dataStreamResponse = createDataStreamResponse({
      execute: (dataStream) => {
        // This is where the AI response is invoked
        // todo consider modifying only the selectedChatModel variable before invoking this
        //executeDefaultChatStream({ dataStream, session, messages, selectedChatModel, systemPromptForExecution, userMessage, id, isProductionEnvironment });
        executeEnhancedChatStream({ dataStream, session, messages, selectedChatModel, systemPromptForExecution, userMessage, id, isProductionEnvironment });
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });
    return dataStreamResponse;
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
