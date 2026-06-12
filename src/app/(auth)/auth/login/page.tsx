import { LoginForm } from "@/components/forms/login-form";

export const metadata = {
  title: "Log In",
};

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Sign in to your account to continue
      </p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </>
  );
}
