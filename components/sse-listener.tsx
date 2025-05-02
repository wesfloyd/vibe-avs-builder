'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface SSEListenerProps {
  chatId: string;
  onCodeUpdate?: (data: any) => void;
  onProcessingError?: (error: string) => void;
}

export function SSEListener({ 
  chatId, 
  onCodeUpdate,
  onProcessingError 
}: SSEListenerProps) {
  const { data: session } = useSession();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  
  useEffect(() => {
    if (!session?.user?.id) {
      console.log('SSE: No user session, not connecting');
      return;
    }
    
    let eventSource: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    const connectSSE = () => {
      // Close any existing connection
      if (eventSource) {
        eventSource.close();
      }
      
      setConnectionStatus('connecting');
      
      // Ensure user is defined before accessing id
      if (!session?.user?.id) return;
      
      // Create new connection
      eventSource = new EventSource(`/api/sse?userId=${session.user.id}`);
      
      // Connection established
      eventSource.addEventListener('connected', () => {
        setConnectionStatus('connected');
        reconnectAttempts = 0;
        console.log('SSE: Connected to event stream');
      });
      
      // Listen for code updates
      eventSource.addEventListener('codeUpdate', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.chatId === chatId) {
            console.log('SSE: Received code update for current chat');
            onCodeUpdate?.(data);
          }
        } catch (err) {
          console.error('SSE: Error parsing code update data:', err);
        }
      });
      
      // Listen for errors
      eventSource.addEventListener('processingError', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.chatId === chatId) {
            console.log('SSE: Received processing error for current chat');
            onProcessingError?.(data.error);
          }
        } catch (err) {
          console.error('SSE: Error parsing processing error data:', err);
        }
      });
      
      // Ping event (keep-alive)
      eventSource.addEventListener('ping', () => {
        // Connection is still alive
      });
      
      // Handle connection errors
      eventSource.addEventListener('error', () => {
        if (eventSource?.readyState === EventSource.CLOSED) {
          setConnectionStatus('disconnected');
          
          // Attempt to reconnect with exponential backoff
          if (reconnectAttempts < maxReconnectAttempts) {
            const reconnectDelay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`SSE: Connection lost. Reconnecting in ${reconnectDelay}ms...`);
            
            reconnectTimer = setTimeout(() => {
              reconnectAttempts++;
              connectSSE();
            }, reconnectDelay);
          } else {
            console.error('SSE: Max reconnect attempts reached. Giving up.');
            toast.error('Lost connection to the server. Please refresh the page.');
          }
        }
      });
    };
    
    // Initial connection
    connectSSE();
    
    // Cleanup on unmount
    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [session?.user?.id, chatId, onCodeUpdate, onProcessingError]);
  
  return null; // This component doesn't render anything
} 