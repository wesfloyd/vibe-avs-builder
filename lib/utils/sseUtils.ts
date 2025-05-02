import { NextRequest } from 'next/server';

// Map to store active SSE connections
// Key: userId, Value: ReadableStreamController
const activeSSEConnections = new Map<string, ReadableStreamDefaultController>();

/**
 * Stores an SSE connection controller for a specific user
 */
export function storeSSEConnection(userId: string, controller: ReadableStreamDefaultController): void {
  activeSSEConnections.set(userId, controller);
}

/**
 * Removes an SSE connection for a user
 */
export function removeSSEConnection(userId: string): void {
  activeSSEConnections.delete(userId);
}

/**
 * Gets an SSE connection controller for a user if it exists
 */
export function getSSEConnection(userId: string): ReadableStreamDefaultController | undefined {
  return activeSSEConnections.get(userId);
}

/**
 * Sends an SSE event to a specific user
 */
export function sendSSEEvent(userId: string, eventName: string, data: any): boolean {
  const controller = activeSSEConnections.get(userId);
  if (!controller) {
    return false;
  }

  try {
    const event = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(new TextEncoder().encode(event));
    return true;
  } catch (error) {
    console.error(`Error sending SSE event to user ${userId}:`, error);
    return false;
  }
}

/**
 * Creates and configures an SSE response
 */
export function createSSEResponse(req: NextRequest, userId: string): Response {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Store the controller for later use
      storeSSEConnection(userId, controller);
      
      // Send initial connection message
      controller.enqueue(encoder.encode('event: connected\ndata: {"status":"connected"}\n\n'));
      
      // Keep connection alive with periodic pings
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode('event: ping\ndata: {}\n\n'));
        } catch (e) {
          // Connection likely closed
          clearInterval(keepAliveInterval);
          removeSSEConnection(userId);
        }
      }, 30000); // 30-second ping
      
      // Clean up when client disconnects
      req.signal.addEventListener('abort', () => {
        clearInterval(keepAliveInterval);
        removeSSEConnection(userId);
      });
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
} 