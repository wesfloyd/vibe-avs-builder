import { createResetToken } from '@/lib/db/queries';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const resetToken = await createResetToken(email);

    if (!resetToken) {
      // Don't reveal whether a user exists for security
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
      });
    }

    // In a real application, you would send an email here with a link containing the reset token
    // For demo purposes, we'll just return the token
    // TODO: Use your email service provider to send an email
    console.log(`Reset token for ${email}: ${resetToken}`);

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
