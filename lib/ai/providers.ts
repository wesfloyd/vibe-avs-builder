import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';

import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';

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
