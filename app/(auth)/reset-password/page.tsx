'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import NextLink from 'next/link';
import { ResetPasswordForm } from '@/components/reset-password-form';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  return (
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
            Invalid or missing token. Please request a new password reset link.
          </p>
          <NextLink
            href="/forgot-password"
            className="font-medium underline underline-offset-4 hover:text-foreground"
          >
            Return to Forgot Password
          </NextLink>
        </div>
      )}

      <div className="mt-4 flex items-center justify-center">
        <NextLink
          href="/login"
          className="text-sm text-muted-foreground hover:text-primary font-medium underline underline-offset-4"
        >
          Back to Login
        </NextLink>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
