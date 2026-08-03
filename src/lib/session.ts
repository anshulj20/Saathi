import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

type Role = "customer" | "nurse" | "admin";

/** Redirects to /login (or / on role mismatch) if not authenticated. */
export async function requireUser(role?: Role) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (role && session.user.role !== role) redirect("/");
  return session.user;
}

/** Throws if the given user isn't an active account — for use inside Server Actions. */
export function assertActive(user: { status: string }) {
  if (user.status !== "active") {
    throw new Error(
      "Your account is still awaiting verification by the Saathi team."
    );
  }
}
