import { type DataStreamWriter, streamText, tool } from 'ai';
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
    }),
    execute: async ({ idea, design }) => {
      console.log('tool:createPrototype for', { idea, design });

      const userPrompt = `Idea: ${idea}\n\nDesign: ${design}`;

      logContentForDebug(userPrompt, 'user-prompt.txt', 'Create Prototype Tool');
      logContentForDebug(await stage3PrototypePrompt(), 'system-prompt.txt', 'Create Prototype Tool');
      const result = await streamText({
        model: myProvider.languageModel(DEFAULT_CHAT_MODEL),
        system: await stage3PrototypePrompt(),
        prompt: userPrompt,
      });

      for await (const delta of result.textStream) {
        dataStream.writeData({ type: 'text', content: delta });
      }

      dataStream.writeData({ type: 'finish', content: '' });

      return 'Working on building your AVS Prototype now. ';
    },
  }); 