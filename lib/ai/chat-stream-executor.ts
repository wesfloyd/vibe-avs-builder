import {
  getMostRecentUserMessage,
} from '@/lib/utils';
import type { UIMessage } from 'ai';
import type { Session } from 'next-auth';
import { streamText, smoothStream, appendResponseMessages } from 'ai';
import { modelFullStreaming, myProvider, claude37sonnet, openaiProvider } from '@/lib/ai/providers';
import {
  generateUUID,
  getTrailingMessageId,
} from '@/lib/utils';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { saveMessages } from '@/lib/db/queries';
import { logContentForDebug, logStreamForDebug } from '@/lib/utils/debugUtils';
import { HumanMessage } from '@langchain/core/messages';
import { SystemMessage } from '@langchain/core/messages';
import { classifyUserIntent, UserIntent } from './intentManager';
import { basicPrompt, stage1IdeasPrompt, stage2DesignPrompt, stage3PrototypePrompt } from './prompts';
import { AIMessage } from '@langchain/core/messages';
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";


interface ExecuteChatStreamParams {
  dataStream: any; // Using 'any' for now as CoreDataStream seems incorrect
  session: Session;
  messages: UIMessage[];
  selectedChatModel: string;
  systemPrompt: string;
  userMessage: UIMessage;
  id: string; // chat id
  isProductionEnvironment: boolean;
}

// Convert UI messages to LangChain message format
function convertUIMessagesToLangChainMessages(messages: UIMessage[]) {
  return messages.map(message => {
    const content = typeof message.content === 'string' 
      ? message.content 
      : JSON.stringify(message.content);
      
    if (message.role === 'user') {
      return new HumanMessage(content);
    } else if (message.role === 'assistant') {
      return new AIMessage(content);
    }
    // Skip system messages as we'll add a separate system message
    return null;
  }).filter((message): message is HumanMessage | AIMessage => message !== null); // Type guard to remove null values
}


// Get the appropriate LLM model based on selected chat model
function getModelProvider(selectedChatModel: string) {
  console.log('chat-stream-executor: Using model:', selectedChatModel);
  
  switch(selectedChatModel) {
    case 'claude':
      return new ChatAnthropic({
        streaming: true,
        model: "claude-3-7-sonnet-latest",
      });
    case 'chatgpt':
      return new ChatOpenAI({
        streaming: true,
        model: "gpt-4o-mini",
      });
    default:
      console.log('Unknown model, defaulting to Claude');
      return new ChatAnthropic({
        streaming: true,
        model: "claude-3-7-sonnet-latest",
      });
  }
}

export async function generateLLMResponse(messages: UIMessage[], selectedChatModel?: string) {

  
  let systemPrompt = basicPrompt;

  const intent = await classifyUserIntent(messages);
  console.log('chat-stream-executor: intent', intent);
  

  // Update the system prompt based on the user intent.
  switch (intent) {
    case UserIntent.RefineIdea:
      systemPrompt = await stage1IdeasPrompt();
      break;
    case UserIntent.GenerateDesign:
      systemPrompt = await stage2DesignPrompt();
      break;
    case UserIntent.BuildPrototype:
      systemPrompt = await stage3PrototypePrompt();

      break;
    default:
      // do nothing
      break;
  }

  logContentForDebug(systemPrompt, `chat-stream-executor-system-prompt.txt`, 'Chat Stream Executor - System Prompt');

  try {
    // Convert UI messages to LangChain format
    const langChainMessages = [
      new SystemMessage(systemPrompt),
      ...convertUIMessagesToLangChainMessages(messages)
    ];
    

    // Use the selected model or default to claude (modelFullStreaming)
    const modelToUse = selectedChatModel ? getModelProvider(selectedChatModel) : modelFullStreaming;

    
    //if(intent === UserIntent.BuildPrototype) {
    // todo invoke different logic for prototype step a Use a Multi-Step Chain using Use RunnableSequence or RouterRunnable.
  

    // Get the raw stream from the model
    const [streamForUser, streamForLog] = (await modelToUse.stream(langChainMessages)).tee();

    // 2) fire off the logging branch without holding up your response
    logStreamForDebug(
      streamForLog, 
      `llm-stream-${Date.now()}.txt`,
      'Raw LLM response'
    );
    
    // 3) hand back the other branch to the caller
    return streamForUser;
  } catch (error) {
    console.error("LLM response generation failed:", error);
    throw error; // Rethrow to be handled by the POST handler
  }
}







