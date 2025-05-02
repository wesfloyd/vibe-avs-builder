import { NextRequest } from 'next/server';
import { createSSEResponse } from '@/lib/utils/sseUtils';

/**
 * Server-Sent Events endpoint that maintains a persistent connection
 * to send real-time updates to the client.
 * 
 * NOTE: In a production environment, proper authentication should be
 * implemented. This uses the userId from the URL for demonstration purposes.
 */
export async function GET(req: NextRequest) {
  try {
    // Get userId from URL parameter
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return new Response('User ID is required', { status: 400 });
    }

    // Create and return SSE response
    return createSSEResponse(req, userId);
  } catch (error) {
    console.error('Error setting up SSE connection:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Required for streaming responses in Next.js
export const dynamic = 'force-dynamic'; 