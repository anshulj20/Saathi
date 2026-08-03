import { SignupForm } from "./signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;

  return (
    <div className="max-w-lg mx-auto w-full px-6 py-16">
      <h1 className="font-serif text-3xl font-semibold text-ink mb-2">
        Join Saathi
      </h1>
      <p className="text-muted mb-8">
        Create your account. Every account is manually verified by our team
        before it goes live.
      </p>
      <SignupForm initialRole={role === "nurse" ? "nurse" : "customer"} />
    </div>
  );
}
