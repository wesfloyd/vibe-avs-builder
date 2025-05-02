import { sendSSEEvent } from './sseUtils';
import { consumeStreamToText } from './debugUtils';

/**
 * Process an LLM response stream in the background and send follow-up messages
 * to the client using SSE.
 * 
 * @param originalContent The original content from LLM
 * @param userId The user ID to send updates to
 * @param chatId The chat ID for context
 */
export async function processResponseInBackground(
  originalContent: string,
  userId: string,
  chatId: string
): Promise<void> {
  try {
    console.log(`Starting background processing for chat ${chatId}`);
    
    // Simulate processing time (replace with actual processing logic)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Example: Extract code blocks and modify them
    const codeBlocks = extractCodeBlocks(originalContent);
    const enhancedCode = enhanceCodeBlocks(codeBlocks);
    
    // Send the enhanced code as a follow-up message
    sendSSEEvent(userId, 'codeUpdate', {
      chatId,
      type: 'code-enhancement',
      content: "Here's an improved version of the code:",
      enhancedCode
    });
    
    console.log(`Background processing completed for chat ${chatId}`);
  } catch (error) {
    console.error(`Error in background processing for chat ${chatId}:`, error);
    // Attempt to notify user of error
    sendSSEEvent(userId, 'processingError', {
      chatId,
      error: 'Failed to process the code. Please try again.'
    });
  }
}

/**
 * Process a stream in the background
 * 
 * @param stream The LLM response stream
 * @param userId The user ID to send updates to
 * @param chatId The chat ID for context
 */
export async function processStreamInBackground(
  stream: ReadableStream,
  userId: string,
  chatId: string
): Promise<void> {
  try {
    // Consume the stream to get full text
    const fullContent = await consumeStreamToText(stream);
    
    // Process the content
    await processResponseInBackground(fullContent, userId, chatId);
  } catch (error) {
    console.error(`Error processing stream for chat ${chatId}:`, error);
  }
}

/**
 * Extract code blocks from markdown content
 * Simple regex-based implementation
 */
function extractCodeBlocks(content: string): string[] {
  const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push(match[1]);
  }
  
  return blocks;
}

/**
 * Enhance code blocks with additional functionality
 * This is a placeholder for actual code enhancement logic
 */
function enhanceCodeBlocks(codeBlocks: string[]): string[] {
  return codeBlocks.map(code => {
    // Example enhancement: Add console.log for debugging
    // In a real implementation, this would be more sophisticated
    if (code.includes('function ')) {
      return code.replace(
        /function\s+(\w+)\s*\([^)]*\)\s*{/g, 
        'function $1(...args) {\n  console.log("Function $1 called with:", args);'
      );
    }
    return code;
  });
} 