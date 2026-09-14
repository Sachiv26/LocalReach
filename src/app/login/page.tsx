import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { env } from "@/lib/env";

export const metadata = { title: "Sign in", description: "Sign in to LocalReach." };

export default function LoginPage({ searchParams }: { searchParams: { registered?: string } }) {
  const params = searchParams;

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your LocalReach account.">
      {params.registered ? (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
          Account created — sign in below.
        </p>
      ) : null}
      <LoginForm googleEnabled={env.googleOAuthEnabled} />
    </AuthShell>
  );
}