import { anthropic } from '@ai-sdk/anthropic';

import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';

export const myProvider = customProvider({
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
