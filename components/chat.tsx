'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { toast } from 'sonner';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { SSEListener } from './sse-listener';

export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
  } = useChat({
    id,
    body: { id, selectedChatModel: selectedChatModel },
    api: '/api/chat',
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      console.error('Chat hook threw:', error);
      if (error instanceof Response) {
        console.error(`  status = ${error.status} ${error.statusText}`);
        error.text().then((body) => console.error('  response body:', body));
      } else if (error instanceof Error) {
        console.error(error.stack);
      }
      toast.error('An error occurred, please try again!');
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
  
  // Handle code updates from SSE
  const handleCodeUpdate = (data: any) => {
    if (data.enhancedCode && Array.isArray(data.enhancedCode) && data.enhancedCode.length > 0) {
      // Append a new message from the assistant with the enhanced code
      const enhancedCodeMessage: UIMessage = {
        id: generateUUID(),
        role: 'assistant',
        content: data.content || "Here's an improved version of the code:",
        parts: [{
          type: 'text', 
          text: data.content || "Here's an improved version of the code:"
        }],
        createdAt: new Date(),
      };
      
      // Add code blocks to the message
      data.enhancedCode.forEach((codeBlock: string) => {
        enhancedCodeMessage.parts.push({
          type: 'text',
          text: '```\n' + codeBlock + '\n```'
        });
      });
      
      setMessages([...messages, enhancedCodeMessage]);
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    }
  };
  
  // Handle processing errors
  const handleProcessingError = (error: string) => {
    toast.error(error || 'An error occurred during code processing');
  };

  return (
    <>
      {/* SSE Listener component */}
      <SSEListener 
        chatId={id}
        onCodeUpdate={handleCodeUpdate}
        onProcessingError={handleProcessingError}
      />
      
      <div id="chat" className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={selectedChatModel}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />

        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
            />
          )}
        </form>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
      />
    </>
  );
}
