import { type CoreMessage, type DataStreamWriter, generateText, tool, type ToolExecutionOptions } from 'ai';
import { z } from 'zod';
import type { Session } from 'next-auth';
import { myProvider } from '@/lib/ai/providers';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { stage3PrototypePrompt } from '../prompts';
import { logContentForDebug } from '@/lib/utils/debugUtils';

interface CreatePrototypeProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const createPrototype = ({ session, dataStream }: CreatePrototypeProps) =>
  tool({
    description: 'Create a prototype based on an idea and design description.',
    parameters: z.object({
      idea: z.string().describe('The core idea for the prototype'),
      design: z.string().describe('Text description of the desired design'),
      userMessage: z.string().describe('The last user message'),
    }),
    execute: async ({ idea, design}) => {
      
      //console.log('tool:createPrototype for', { idea, design });

      const promptForGeneration = `Idea: ${idea}\nDesign: ${design}`;

      const systemPrompt = await stage3PrototypePrompt();
      logContentForDebug(promptForGeneration, 'createPrototype:user-prompt.txt', 'Create Prototype Tool');
      logContentForDebug(systemPrompt, 'createPrototype:system-prompt.txt', 'Create Prototype Tool');
      
      const result = await generateText({
        model: myProvider.languageModel(DEFAULT_CHAT_MODEL),
        system: systemPrompt,
        prompt: promptForGeneration,
      });

      logContentForDebug(result.text, 'createPrototype:result.text', 'Create Prototype Tool');
      
      return result.text
    
    
    },
  }); 