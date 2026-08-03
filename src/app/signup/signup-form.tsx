"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signupAction, type SignupState } from "@/lib/actions/signup";
import { trackSignupCompleted } from "@/lib/posthog-events";
import { SPECIALIZATIONS, GENDERS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/ui";

const roleHome: Record<string, string> = {
  customer: "/search",
  nurse: "/dashboard",
};

export function SignupForm({
  initialRole,
}: {
  initialRole: "customer" | "nurse";
}) {
  const [role, setRole] = useState<"customer" | "nurse">(initialRole);
  const [state, formAction, pending] = useActionState<SignupState, FormData>(
    signupAction,
    undefined
  );
  const router = useRouter();

  useEffect(() => {
    if (state?.ok && state.role) {
      trackSignupCompleted(state.role);
      router.push(roleHome[state.role] ?? "/");
      router.refresh();
    }
  }, [state, router]);

  const errors = state?.errors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="role" value={role} />

      <div className="grid grid-cols-2 gap-2 p-1 bg-black/[0.04] rounded-lg">
        {(["customer", "nurse"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={cn(
              "py-2.5 rounded-md text-sm font-semibold transition-colors",
              role === r ? "bg-white shadow text-primary-dark" : "text-muted"
            )}
          >
            {r === "customer" ? "I need care" : "I'm a nurse"}
          </button>
        ))}
      </div>

      <FormField label="Full name" htmlFor="name" error={errors.name?.[0]}>
        <Input id="name" name="name" placeholder="Meera Krishnan" required />
      </FormField>

      <div className="grid sm:grid-cols-2 gap-5">
        <FormField label="Phone" htmlFor="phone" error={errors.phone?.[0]}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+91 98xxxxxxxx"
            required
          />
        </FormField>
        <FormField label="Email" htmlFor="email" error={errors.email?.[0]}>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
          />
        </FormField>
      </div>

      <FormField
        label="Password"
        htmlFor="password"
        error={errors.password?.[0]}
        hint="At least 8 characters."
      >
        <Input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
        />
      </FormField>

      {role === "customer" && (
        <FormField
          label="Household location"
          htmlFor="locationText"
          error={errors.locationText?.[0]}
          hint="Neighbourhood/area — used to match nearby nurses."
        >
          <Input
            id="locationText"
            name="locationText"
            placeholder="Indiranagar, Bengaluru"
            required
          />
        </FormField>
      )}

      {role === "nurse" && (
        <>
          <div className="grid sm:grid-cols-2 gap-5">
            <FormField label="Gender" htmlFor="gender" error={errors.gender?.[0]}>
              <Select id="gender" name="gender" defaultValue="" required>
                <option value="" disabled>
                  Select
                </option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g[0].toUpperCase() + g.slice(1)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              label="Years of experience"
              htmlFor="experienceYears"
              error={errors.experienceYears?.[0]}
            >
              <Input
                id="experienceYears"
                name="experienceYears"
                type="number"
                min={0}
                max={60}
                required
              />
            </FormField>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <FormField
              label="Price per 8-hr shift (₹)"
              htmlFor="pricePerDay"
              error={errors.pricePerDay?.[0]}
            >
              <Input
                id="pricePerDay"
                name="pricePerDay"
                type="number"
                min={1}
                step="1"
                placeholder="1100"
                required
              />
            </FormField>
            <FormField
              label="Area you serve"
              htmlFor="locationText"
              error={errors.locationText?.[0]}
            >
              <Input
                id="locationText"
                name="locationText"
                placeholder="Indiranagar, Bengaluru"
                required
              />
            </FormField>
          </div>

          <FormField
            label="Specializations"
            htmlFor="specializations"
            error={errors.specializations?.[0]}
          >
            <div className="grid sm:grid-cols-2 gap-2">
              {SPECIALIZATIONS.map((spec) => (
                <label
                  key={spec}
                  className="flex items-center gap-2 text-sm border border-border rounded-lg px-3 py-2.5 cursor-pointer hover:bg-primary-tint/40"
                >
                  <input
                    type="checkbox"
                    name="specializations"
                    value={spec}
                    className="accent-[var(--color-primary)]"
                  />
                  {spec}
                </label>
              ))}
            </div>
          </FormField>

          <FormField
            label="Short bio (optional)"
            htmlFor="bio"
            error={errors.bio?.[0]}
          >
            <Textarea
              id="bio"
              name="bio"
              rows={3}
              placeholder="Your background and what families can expect from you."
            />
          </FormField>
        </>
      )}

      {state?.message && (
        <p className="text-sm text-danger">{state.message}</p>
      )}

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-sm text-muted text-center">
        Already have an account?{" "}
        <a href="/login" className="text-primary-dark font-semibold">
          Log in
        </a>
      </p>
    </form>
  );
}
