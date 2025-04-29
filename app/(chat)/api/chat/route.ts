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
import { ChatAnthropic } from "@langchain/anthropic";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { SystemMessage } from '@langchain/core/messages';
import { HumanMessage } from '@langchain/core/messages';

export enum UserIntent {
  RefineIdea = "RefineIdea",
  GenerateDesign = "GenerateDesign",
  BuildPrototype = "BuildPrototype",
  Other = "Other"
}

const modelName = "claude-3-5-sonnet-latest";


// First LLM: classify intent
async function classifyUserIntent(messages: UIMessage[]): Promise<UserIntent> {
  const chat = new ChatAnthropic({
    streaming: false, // Switch to non-streaming for classification since we only need the final result
    model: modelName,
  });

  const systemPrompt = `
You are a classifier.
Given the user's recent messages, determine:
1) Refine idea
2) Generate design
3) Build prototype code
4) Other
Return only one of: RefineIdea, GenerateDesign, BuildPrototype, Other.
  `;

  // Only use the last few messages for intent classification to improve efficiency
  const recentMessages = messages.slice(-3);
  const userText = recentMessages.map(m => m.content).join("\n");

  try {
    const result = await chat.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userText)
    ]);

    let raw = "";
    if (typeof result.content === 'string') {
      raw = result.content.trim();
    } else if (Array.isArray(result.content)) {
      // Handle complex message content by converting to string
      raw = JSON.stringify(result.content).trim();
    } else {
      raw = String(result.content).trim();
    }

    // Use direct object lookup instead of switch for better performance
    const intentMap: Record<string, UserIntent> = {
      "RefineIdea": UserIntent.RefineIdea,
      "GenerateDesign": UserIntent.GenerateDesign,
      "BuildPrototype": UserIntent.BuildPrototype
    };

    return intentMap[raw] || UserIntent.Other;
  } catch (error) {
    console.error("Intent classification failed:", error);
    return UserIntent.Other; // Fallback to Other on error
  }
}

// Second LLM: generate poem
async function generatePoem(messages: UIMessage[], intent: UserIntent) {
  const chat = new ChatAnthropic({
    streaming: true,
    model: modelName,
  });

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


    // Todo: consider re-enabling this in the future.
    // // Get current chat
    // const chat = await getChatById({ id });
    // // If no current chat exists, create and save it
    // if (!chat) {
    //   const title = await generateTitleFromUserMessage({
    //     message: userMessage,
    //   });
    //   await saveChat({ id, userId: session.user.id, title });
    // } else {
    //   if (chat.userId !== session.user.id) {
    //     return new Response('Unauthorized', { status: 401 });
    //   }
    // }
    // // Save user message
    // await saveMessages({
    //   messages: [
    //     {
    //       chatId: id,
    //       id: userMessage.id,
    //       role: 'user',
    //       parts: userMessage.parts,
    //       attachments: userMessage.experimental_attachments ?? [],
    //       createdAt: new Date(),
    //     },
    //   ],
    // });

    if (!userMessage) {
      console.error('No user message found');
      return new Response('No user message found', { status: 400 });
    }

    try {
      const intent = await classifyUserIntent(messages);
      const stream = await generatePoem(messages, intent);
      return LangChainAdapter.toDataStreamResponse(stream);
    } catch (error) {
      console.error('Error processing AI response:', error);
      return new Response('Error generating response', { status: 500 });
    }


    // todo: invoke llm to determine user intent is idea generation, design, prototype, or other


    // todo: invoke another llm to confirm user intent and write a poem about it

    // todo: add system prompt to llm with context on EigenLayer, find out how best to do this with langchain


    // const stream = await llm.stream("pick a random number between 1 and 10, then make a quick joke about it");
    // return LangChainAdapter.toDataStreamResponse(stream);



    // // Determine the system prompt based on intent *before* starting the stream execution
    // // Todo: move this to langchain
    // let systemPrompt = systemPromptDefault({ selectedChatModel });

    // const dataStreamResponse = createDataStreamResponse({
    //   execute: (dataStream) => {
    //     executeChatStream({ dataStream, session, messages, selectedChatModel, systemPrompt, userMessage, id, isProductionEnvironment });
    //   },
    //   onError: () => {
    //     return 'Oops, an error occurred!';
    //   },
    // });

    // return dataStreamResponse;



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
