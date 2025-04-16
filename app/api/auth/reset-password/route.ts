import { getUserByResetToken, updateUserPassword } from '@/lib/db/queries';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string().uuid(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    const user = await getUserByResetToken(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        {
          status: 400,
        },
      );
    }

    await updateUserPassword(user.id, password);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Invalid data' }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}
