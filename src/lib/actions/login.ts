"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export type LoginState = { error?: string; ok?: boolean } | undefined;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Incorrect email or password." };
    }
    throw err;
  }
}
