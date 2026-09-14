import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = { title: "Create an account", description: "Join LocalReach and advertise locally." };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Advertise Locally"
      subtitle="Create a free account and start reaching your neighbourhood."
    >
      <RegisterForm />
    </AuthShell>
  );
}