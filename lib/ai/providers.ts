import { anthropic } from '@ai-sdk/anthropic';
import { ChatAnthropic } from "@langchain/anthropic";

import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';



// Higher quality, streaming model
export const modelFullStreaming = new ChatAnthropic({
  streaming: true,
  model: "claude-3-7-sonnet-latest",
  cache: true,
});

// Fast, inexpensive, non-streaming model.
export const modelLiteGenerative = new ChatAnthropic({
  streaming: false, // Switch to non-streaming for classification since we only need the final result
  model: "claude-3-5-sonnet-latest",
  cache: true,
});


export const myProvider = customProvider({
  languageModels: {
    'chat-model': anthropic('claude-3-5-sonnet-latest'),
    'chat-model-reasoning': wrapLanguageModel({
      model: anthropic('claude-3-5-sonnet-latest'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'title-model': anthropic('claude-3-5-sonnet-latest'),
    'artifact-model': anthropic('claude-3-5-sonnet-latest'),
  },
  // note image models are not supported via the anthropic provider & api, this section is removed for now.
});