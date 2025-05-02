import fs from 'fs/promises';
import path from 'path';

/**
 * Logs a given string content to a specified file path within a .debug directory,
 * only during development mode. Creates the directory if it doesn't exist.
 *
 * @param content The string content to log.
 * @param filename The name of the file to log to (e.g., 'system-prompt-log.txt').
 * @param callerInfo Optional string to identify the caller in log messages.
 */
export async function logContentForDebug(
  content: string,
  filename: string,
  callerInfo: string = 'Debug Log'
): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    try {
      const debugDir = path.join(process.cwd(), '.debug');
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const timestampedFilename = `${timeStr}_${filename}`;
      const logFilePath = path.join(debugDir, timestampedFilename);
      await fs.mkdir(debugDir, { recursive: true }); // Ensure directory exists
      await fs.writeFile(logFilePath, content, 'utf8');
      //console.log(`[DEV ONLY - ${callerInfo}] Content logged to: ${logFilePath}`);
    } catch (logError) {
      console.error(`[DEV ONLY - ${callerInfo}] Failed to write debug log to ${filename}:`, logError);
    }
  }
}

/**
 * Logs a streaming response to a file and returns the original stream
 * to be used in the application. This is useful for debugging and
 * analyzing LLM responses during development.
 * 
 * @param streamResponse The streaming response from an LLM model
 * @param filename The name of the file to log to (e.g., 'stream-response.txt')
 * @param callerInfo Optional string to identify the caller in log messages
 * @returns The original stream response
 */
export async function logStreamResponse<T>(
  streamResponse: any, // Use 'any' to handle various stream types
  filename: string,
  callerInfo: string = 'Stream Response Log'
): Promise<any> {
  if (process.env.NODE_ENV !== 'development') {
    return streamResponse; // Only log in development mode
  }

  // If we're not in development mode or we can't process the stream
  // just return the original stream to avoid breaking functionality
  if (!streamResponse) {
    return streamResponse;
  }

  // For Promise<ReadableStream> (common with LangChain)
  if (streamResponse instanceof Promise) {
    return streamResponse.then(resolvedStream => {
      return logStreamToFile(resolvedStream, filename, callerInfo);
    });
  }

  // For direct ReadableStream
  return logStreamToFile(streamResponse, filename, callerInfo);
}

/**
 * Helper function to log a ReadableStream to a file without modifying it
 */
function logStreamToFile(
  stream: any,
  filename: string,
  callerInfo: string
): any {
  // If it's already a ReadableStream, we need to preserve it
  if (stream && typeof stream.getReader === 'function') {
    try {
      // Create a tee to split the stream into two identical streams
      const [stream1, stream2] = stream.tee();
      
      // Use the second stream for logging (non-blocking)
      (async () => {
        try {
          let fullContent = '';
          const reader = stream2.getReader();
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            let chunkContent = '';
            try {
              // Try to extract the content from the chunk
              if (typeof value === 'string') {
                chunkContent = value;
              } else if (value instanceof Uint8Array) {
                chunkContent = new TextDecoder().decode(value);
              } else if (value && typeof value === 'object') {
                chunkContent = extractTextContent(value);
              }
            } catch (e) {
              console.error('Error processing stream chunk for logging:', e);
            }
            
            fullContent += chunkContent;
          }
          
          // After reading the entire stream, write to file
          writeToDebugFile(fullContent, filename, callerInfo);
        } catch (error) {
          console.error(`[DEV ONLY - ${callerInfo}] Error logging stream:`, error);
        }
      })();
      
      // Return the first stream for normal use
      return stream1;
    } catch (error) {
      console.error(`[DEV ONLY - ${callerInfo}] Error setting up stream logging:`, error);
      return stream; // Return original stream if tee fails
    }
  }
  
  // For AsyncIterable (like what LangChain returns)
  if (stream && typeof stream[Symbol.asyncIterator] === 'function') {
    try {
      // Create a TransformStream to log content
      const { readable, writable } = new TransformStream();
      
      // Process the AsyncIterable in the background
      (async () => {
        let fullContent = '';
        
        try {
          const writer = writable.getWriter();
          
          for await (const chunk of stream) {
            // Extract text content from chunk
            let chunkContent = '';
            try {
              chunkContent = extractTextContent(chunk);
            } catch (e) {
              console.error('Error extracting content from chunk:', e);
            }
            
            fullContent += chunkContent;
            
            // Convert chunk to appropriate format and write to the transform stream
            let valueToWrite;
            if (typeof chunk === 'string') {
              valueToWrite = new TextEncoder().encode(chunk);
            } else if (chunk instanceof Uint8Array) {
              valueToWrite = chunk;
            } else {
              valueToWrite = new TextEncoder().encode(JSON.stringify(chunk));
            }
            
            await writer.write(valueToWrite);
          }
          
          // Log the full content to a file
          writeToDebugFile(fullContent, filename, callerInfo);
          
          // Close the writer when done
          await writer.close();
        } catch (error) {
          console.error(`[DEV ONLY - ${callerInfo}] Error processing stream:`, error);
          writable.abort(error);
        }
      })();
      
      // Return the readable side of the TransformStream
      return readable;
    } catch (error) {
      console.error(`[DEV ONLY - ${callerInfo}] Failed to wrap AsyncIterable:`, error);
      // If we can't process it, return a simple passthrough of the original
      return createSimpleReadableStream(stream);
    }
  }
  
  // If we can't handle this type, just return it
  return stream;
}

/**
 * Create a simple ReadableStream from an AsyncIterable
 */
function createSimpleReadableStream(asyncIterable: AsyncIterable<any>): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of asyncIterable) {
          let valueToEnqueue;
          if (typeof chunk === 'string') {
            valueToEnqueue = new TextEncoder().encode(chunk);
          } else if (chunk instanceof Uint8Array) {
            valueToEnqueue = chunk;
          } else {
            valueToEnqueue = new TextEncoder().encode(JSON.stringify(chunk));
          }
          controller.enqueue(valueToEnqueue);
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });
}

/**
 * Helper function to extract text content from various chunk formats
 */
function extractTextContent(chunk: any): string {
  if (typeof chunk === 'string') {
    return chunk;
  } else if (chunk instanceof Uint8Array) {
    return new TextDecoder().decode(chunk);
  } else if (chunk && typeof chunk === 'object') {
    // Try to extract content from common LLM response formats
    if (chunk.content !== undefined) {
      return typeof chunk.content === 'string' ? chunk.content : JSON.stringify(chunk.content);
    } else if (chunk.text !== undefined) {
      return typeof chunk.text === 'string' ? chunk.text : JSON.stringify(chunk.text);
    } else if (chunk.delta && chunk.delta.content !== undefined) {
      // OpenAI format
      return typeof chunk.delta.content === 'string' ? chunk.delta.content : JSON.stringify(chunk.delta.content);
    } else if (chunk.token !== undefined) {
      // Some provider formats
      return typeof chunk.token === 'string' ? chunk.token : JSON.stringify(chunk.token);
    } else {
      // Last resort
      return JSON.stringify(chunk);
    }
  }
  return '';
}

/**
 * Write content to a debug file
 */
async function writeToDebugFile(
  content: string,
  filename: string,
  callerInfo: string
): Promise<void> {
  try {
    const debugDir = path.join(process.cwd(), '.debug');
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const timestampedFilename = `${timeStr}_${filename}`;
    const logFilePath = path.join(debugDir, timestampedFilename);
    await fs.mkdir(debugDir, { recursive: true }); // Ensure directory exists
    await fs.writeFile(logFilePath, content, 'utf8');
    console.log(`[DEV ONLY - ${callerInfo}] Stream response logged to: ${logFilePath}`);
  } catch (logError) {
    console.error(`[DEV ONLY - ${callerInfo}] Failed to write stream log to ${filename}:`, logError);
  }
} 