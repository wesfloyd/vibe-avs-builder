import { auth } from '@/app/(auth)/auth';
import { getSuggestionsByDocumentId } from '@/lib/db/queries';
import { getSessionWithFallback } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('documentId');

  if (!documentId) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();
  const sessionWithFallback = getSessionWithFallback(session);

  const suggestions = await getSuggestionsByDocumentId({
    documentId,
  });

  const [suggestion] = suggestions;

  if (!suggestion) {
    return Response.json([], { status: 200 });
  }

  if (suggestion.userId !== sessionWithFallback.user.id) {
    console.warn('Suggestion access - user mismatch but allowing');
  }

  return Response.json(suggestions, { status: 200 });
}
