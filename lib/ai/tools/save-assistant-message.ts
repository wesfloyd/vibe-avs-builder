import { Session } from 'next-auth';
import type { UIMessage } from 'ai';
import { appendResponseMessages } from 'ai';
import { saveMessages } from '@/lib/db/queries';
import { getTrailingMessageId } from '@/lib/utils';

interface SaveAssistantMessageParams {
  response: { messages: any[] };
  session: Session;
  userMessage: UIMessage;
  id: string;
}

export async function saveAssistantMessage({
  response,
  session,
  userMessage,
  id,
}: SaveAssistantMessageParams): Promise<void> {
  if (!session.user?.id) return;
  
  try {
    const assistantId = getTrailingMessageId({
      messages: response.messages.filter(
        (message) => message.role === 'assistant',
      ),
    });

    if (!assistantId) {
      throw new Error('No assistant message found!');
    }

    const [, assistantMessage] = appendResponseMessages({
      messages: [userMessage],
      responseMessages: response.messages,
    });

    await saveMessages({
      messages: [
        {
          id: assistantId,
          chatId: id,
          role: assistantMessage.role,
          parts: assistantMessage.parts,
          attachments:
            assistantMessage.experimental_attachments ?? [],
          createdAt: new Date(),
        },
      ],
    });
  } catch (error) {
    console.error('Failed to save chat', error);
  }
} 