'use client';

import { useSearchParams } from 'next/navigation';
import { ResetPasswordForm } from '@/components/reset-password-form';
import { Link } from '@/components/ui/link';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Reset Password
          </h1>
          <p className="text-sm text-muted-foreground">
            Create a new password for your account
          </p>
        </div>

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Invalid or missing token. Please request a new password reset
              link.
            </p>
            <Link href="/forgot-password">Return to Forgot Password</Link>
          </div>
        )}

        <div className="mt-4 flex items-center justify-center">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
