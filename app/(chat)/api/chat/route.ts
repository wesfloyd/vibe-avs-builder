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
import { executeDefaultChatStream, executeStage3PrototypeChatStream } from '@/lib/ai/chat-stream-executor';


export const maxDuration = 60;

export async function POST(request: Request) {
  
  console.time('POST');
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

    console.time('saveMessages');
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
    console.timeEnd('saveMessages');

    // Todo: set a default chat model here rather than consuming from selectedChatModel (normal vs reasoning)?

    console.time('inferUserIntent');
    // Infer the user's current intent
    const likelyIntent = await inferUserIntent(
      userMessage.content,
      selectedChatModel,// todo: modify this to use a minimal fast model?
    );
    console.log('Inferred user intent:', likelyIntent);
    console.timeEnd('inferUserIntent');

    console.time('systemPromptForExecution');
    // Determine the system prompt based on intent *before* starting the stream execution
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
    console.log('systemPromptForExecution char count: ', systemPromptForExecution.length);
    console.log('systemPromptForExecution token count should be approx 3.5x the char count, which is ', systemPromptForExecution.length * 3.5);
    console.timeEnd('systemPromptForExecution');

    console.time('logContentForDebug');
    // Log the system prompt for debugging in development
    await logContentForDebug(systemPromptForExecution, `system-prompt-log.txt`, 'Chat API');
    console.timeEnd('logContentForDebug');  

    console.time('createDataStreamResponse');
    const dataStreamResponse = createDataStreamResponse({
      execute: (dataStream) => {
        // This is where the AI response is invoked
        if (likelyIntent === 'Prototype') {
          console.time('executeStage3PrototypeChatStream');  
        // Todo: modify so that Stage 3 is sent to claude 3.7 sonnet, rather than the default datastream.
        // consider modifying only the selectedChatModel variable before invoking this
        
          // Execute the stage 3 prototype chat stream
          executeStage3PrototypeChatStream({
            dataStream,
            session,
            messages,
            selectedChatModel,
            systemPromptForExecution,
            userMessage,
            id,
            isProductionEnvironment,
          });
          console.timeEnd('executeStage3PrototypeChatStream');
        } else {
          // Execute the default chat stream for other intents
          console.time('executeDefaultChatStream');
          executeDefaultChatStream({
            dataStream,
            session,
            messages,
            selectedChatModel,
            systemPromptForExecution,
            userMessage,
            id,
            isProductionEnvironment,
          });
          console.timeEnd('executeDefaultChatStream');
        }
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });
    console.timeEnd('createDataStreamResponse');
    console.timeEnd('POST');
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
