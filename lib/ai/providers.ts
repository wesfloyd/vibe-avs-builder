import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
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

// This provider will be used as the least expensive "default" provider.
// Note: image models are not supported via the anthropic provider & api, this section is removed for now.
export const myProvider = customProvider({
  languageModels: {
    'chat-model': anthropic('claude-3-7-sonnet-latest'),
    'chat-model-reasoning': wrapLanguageModel({
      model: anthropic('claude-3-7-sonnet-latest'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'title-model': anthropic('claude-3-7-sonnet-latest'),
    'artifact-model': anthropic('claude-3-7-sonnet-latest'),
  },
  // note image models are not supported via the anthropic provider & api, this section is removed for now.
});

export const claude35haiku = customProvider({
  languageModels: {
    'chat-model': anthropic('claude-3-5-haiku-20241022'),
    'chat-model-reasoning': wrapLanguageModel({
      model: anthropic('claude-3-5-haiku-20241022'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'title-model': anthropic('claude-3-5-haiku-20241022'),
    'artifact-model': anthropic('claude-3-5-haiku-20241022'),
  },
  // note image models are not supported via the anthropic provider & api, this section is removed for now.
});


export const claude37sonnet = customProvider({
  languageModels: {
    'chat-model': anthropic('claude-3-7-sonnet-latest'),
    'title-model': anthropic('claude-3-7-sonnet-latest'),
    'artifact-model': anthropic('claude-3-7-sonnet-latest'),
  },
  // note image models are not supported via the anthropic provider & api, this section is removed for now.
});


// Todo: add additional providers here for higher quality inference.
// OpenAI model guide: https://platform.openai.com/docs/models
export const openaiProvider = customProvider({
  languageModels: {
    'chat-model': openai('gpt-4o-mini'),
  },
});
