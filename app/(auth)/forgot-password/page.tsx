import { ForgotPasswordForm } from '@/components/forgot-password-form';
import { Link } from '@/components/ui/link';

export default function ForgotPasswordPage() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Forgot Password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email address to receive a password reset link
          </p>
        </div>

        <ForgotPasswordForm />

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
