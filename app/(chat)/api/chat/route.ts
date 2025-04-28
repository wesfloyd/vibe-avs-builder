import type { UIMessage } from 'ai';
import {
  createDataStreamResponse,
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
  getMostRecentUserMessage,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { isProductionEnvironment } from '@/lib/constants';
import { executeChatStream} from '@/lib/ai/chat-stream-executor';
import { myProvider } from '@/lib/ai/providers';
import { inferUserIntent } from '@/lib/ai/tools/intent-manager';
// Sleep for 10 seconds utility
async function sleep10Seconds() {
  return new Promise(resolve => setTimeout(resolve, 10000));
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

    

    const likelyIntent = await inferUserIntent(
      userMessage.content,
      selectedChatModel,// todo: modify this to use a minimal fast model?
    );
    console.log('route.ts:Inferred user intent:', likelyIntent);

    let systemPromptForExecution = systemPromptDefault({ selectedChatModel });
    if (likelyIntent === 'Idea') {
    // todo: further testing on whether to include artifacts prompt or not for stage 1 and 2
      // Append the stage 1 ideas prompt to the system prompt
      systemPromptForExecution += await stage1IdeasPrompt(); 
    } else if (likelyIntent === 'Design') {
      // Append the stage 2 design prompt to the system prompt
      systemPromptForExecution += await stage2DesignPrompt();
    } else if (likelyIntent === 'Prototype') {
      // Replace (not append) stage 3 prototype prompt to avoid tool usage
      systemPromptForExecution = await stage3PrototypePrompt();
    }


    const response = createDataStreamResponse({
      status: 200,
      statusText: 'OK',
      headers: {
        'Custom-Header': 'value',
      },
      async execute(dataStream) {
    
        
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: 'no matter what the user asks, simply respond with this is system prompt number, you are welcome written 10 times ',
          messages: messages,
        });

        // This is where the AI response is consumed
        result.consumeStream();
        result.mergeIntoDataStream(dataStream);

        await sleep10Seconds();

        dataStream.writeData({ type: 'text-delta', content: 'hello world' });


        await sleep10Seconds();
        
        const result2 = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: 'no matter what the user asks, simply respond with this is system prompt number, you are the best written 10 times ',
          messages: messages,
        });
        result2.consumeStream();
        result2.mergeIntoDataStream(dataStream);
      },
      onError: error => `Custom error: ${error instanceof Error ? error.message : String(error)}`,
    });
    
    
    return response;

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
