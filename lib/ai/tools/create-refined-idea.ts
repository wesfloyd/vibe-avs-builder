import { z } from 'zod';
import { getDocumentById, saveSuggestions } from '@/lib/db/queries';
import { Suggestion } from '@/lib/db/schema';
import { generateUUID } from '@/lib/utils';
import { myProvider } from '../providers';
import { Session } from 'next-auth';
import { DataStreamWriter, streamObject, tool } from 'ai';

interface RefinedIdeaProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const createRefinedIdea  = ({
      session,
      dataStream,
    }: RefinedIdeaProps) =>
      tool({
        description: 'Generates a refined idea for an Autonomously Verified Service (AVS) idea provided by the user.',
        parameters: z.object({
          documentId: z
            .string()
            .describe('The ID of the document to request edits'),
        }),
        execute: async ({ documentId }) => {
          const document = await getDocumentById({ id: documentId });
    
          if (!document || !document.content) {
            return {
              error: 'Document not found',
            };
          }
    
          const suggestions: Array<
            Omit<Suggestion, 'userId' | 'createdAt' | 'documentCreatedAt'>
          > = [];
    
          // Todo stream object or text tbd
          const { elementStream } = streamObject({
            model: myProvider.languageModel('artifact-model'),
            system:
              'Todo',
            prompt: 'todo', // todo: add prompt
            output: 'array',
            schema: z.object({
              originalSentence: z.string().describe('The original sentence'),
              suggestedSentence: z.string().describe('The suggested sentence'),
              description: z.string().describe('The description of the suggestion'),
            }),
          });
    
          for await (const element of elementStream) {
            const suggestion = {
              originalText: element.originalSentence,
              suggestedText: element.suggestedSentence,
              description: element.description,
              id: generateUUID(),
              documentId: documentId,
              isResolved: false,
            };
    
            dataStream.writeData({
              type: 'suggestion',
              content: suggestion,
            });
    
            suggestions.push(suggestion);
          }
    
          if (session.user?.id) {
            const userId = session.user.id;
    
            await saveSuggestions({
              suggestions: suggestions.map((suggestion) => ({
                ...suggestion,
                userId,
                createdAt: new Date(),
                documentCreatedAt: document.createdAt,
              })),
            });
          }
    
          return {
            id: documentId,
            title: document.title,
            kind: document.kind,
            message: 'Suggestions have been added to the document',
          };
        },
      });