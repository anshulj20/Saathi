"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction, type LoginState } from "@/lib/actions/login";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    undefined
  );
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) {
      router.push("/");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormField label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" required autoFocus />
      </FormField>
      <FormField label="Password" htmlFor="password">
        <Input id="password" name="password" type="password" required />
      </FormField>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Logging in…" : "Log in"}
      </Button>

      <p className="text-sm text-muted text-center">
        New to Saathi?{" "}
        <a href="/signup" className="text-primary-dark font-semibold">
          Create an account
        </a>
      </p>
    </form>
  );
}
