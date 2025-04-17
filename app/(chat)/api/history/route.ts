import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';
import { getChatsByUserId } from '@/lib/db/queries';
import { getSessionWithFallback } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Number.parseInt(searchParams.get('limit') || '10');
  const startingAfter = searchParams.get('starting_after');
  const endingBefore = searchParams.get('ending_before');

  if (startingAfter && endingBefore) {
    return Response.json(
      'Only one of starting_after or ending_before can be provided!',
      { status: 400 },
    );
  }

  const session = await auth();
  const sessionWithFallback = getSessionWithFallback(session);

  try {
    const chats = await getChatsByUserId({
      id: sessionWithFallback.user.id,
      limit,
      startingAfter,
      endingBefore,
    });

    return Response.json({
      chats,
      hasMore: false,
    });
  } catch (error) {
    console.error('Failed to fetch chats:', error);
    // Return empty results on error instead of error message
    return Response.json({
      chats: [],
      hasMore: false,
    });
  }
}
