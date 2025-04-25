import { generateUUID } from '@/lib/utils';
import { type DataStreamWriter, tool } from 'ai';
import { z } from 'zod';
import type { Session } from 'next-auth';
import {
  artifactKinds,
  documentHandlersByArtifactKind,
} from '@/lib/artifacts/server';
import { textDocumentHandler } from '@/artifacts/text/server';

interface RefinedIdeaProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const createRefinedIdea  = ({
      session,
      dataStream,
    }: RefinedIdeaProps) =>
      tool({
        description:
          'Create a refined idea document for the users AVS idea',
        parameters: z.object({
          title: z.string(),
          kind: z.enum(artifactKinds),
        }),
        execute: async ({ title, kind }) => {
          console.log('tool:createRefinedIdea for', { title, kind });
          const id = generateUUID();
    
          dataStream.writeData({
            type: 'kind',
            content: 'text',
          });
    
          dataStream.writeData({
            type: 'id',
            content: id,
          });
    
          dataStream.writeData({
            type: 'title',
            content: title,
          });
    
          dataStream.writeData({
            type: 'clear',
            content: '',
          });
    
          const documentHandler = textDocumentHandler;
    
          if (!documentHandler) {
            throw new Error(`No document handler found for kind: ${kind}`);
          }
    
          await documentHandler.onCreateDocument({
            id,
            title,
            dataStream,
            session,
          });
    
          dataStream.writeData({ type: 'finish', content: '' });
    
          return {
            id,
            title,
            kind,
            content: 'A refined idea document was created and is now visible to the user.',
          };
        },
      });