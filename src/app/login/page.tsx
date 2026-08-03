import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto w-full px-6 py-16">
      <h1 className="font-serif text-3xl font-semibold text-ink mb-2">
        Log in
      </h1>
      <p className="text-muted mb-8">Welcome back to Saathi.</p>
      <LoginForm />
    </div>
  );
}
