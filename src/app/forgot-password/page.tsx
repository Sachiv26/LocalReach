import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata = { title: "Forgot password", description: "Reset your LocalReach password." };
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset your password" subtitle="We’ll email you a secure reset link.">
      <ForgotPasswordForm />
      <p className="mt-4 text-center text-sm text-gray-500">
        Remembered it? <Link href="/login" className="font-semibold text-brand-700 hover:underline">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}