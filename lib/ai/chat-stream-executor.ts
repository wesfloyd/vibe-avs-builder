import {
  getMostRecentUserMessage,
} from '@/lib/utils';
import type { UIMessage } from 'ai';
import type { Session } from 'next-auth';
import { streamText, smoothStream, appendResponseMessages } from 'ai';
import { modelFullStreaming, myProvider } from '@/lib/ai/providers';
import {
  generateUUID,
  getTrailingMessageId,
} from '@/lib/utils';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { saveMessages } from '@/lib/db/queries';
import { logContentForDebug } from '@/lib/utils/debugUtils';
import { HumanMessage } from '@langchain/core/messages';
import { SystemMessage } from '@langchain/core/messages';
import { classifyUserIntent, UserIntent } from './intentManager';
import { basicPrompt, stage1IdeasPrompt, stage2DesignPrompt, stage3PrototypePrompt } from './prompts';
import { AIMessage } from '@langchain/core/messages';

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

export async function generateLLMResponse(messages: UIMessage[]) {
  
  let systemPrompt = basicPrompt;

  const intent = await classifyUserIntent(messages);
  console.log('chat-stream-executor: intent', intent);
  
  switch (intent) {
    case UserIntent.RefineIdea:
      systemPrompt += stage1IdeasPrompt();
      break;
    case UserIntent.GenerateDesign:
      systemPrompt += stage2DesignPrompt();
      break;
    case UserIntent.BuildPrototype:
      systemPrompt += stage3PrototypePrompt();
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
    
    
    if(intent === UserIntent.BuildPrototype) {
      // Invoke a Use a Multi-Step Chain using Use RunnableSequence or RouterRunnable.
      // Todo: implement this.
      return modelFullStreaming.stream(langChainMessages);
    } else {
      // Generate a streaming response per usual.
      return modelFullStreaming.stream(langChainMessages);
    }
  } catch (error) {
    console.error("LLM response generation failed:", error);
    throw error; // Rethrow to be handled by the POST handler
  }
}







