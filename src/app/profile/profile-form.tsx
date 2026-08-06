"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateProfileAction, type ProfileState } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/form";

type Initial = {
  name: string;
  phone: string;
  email: string;
  locationText: string;
  patientName: string;
  conditionSummary: string;
  contactName: string;
  contactPhone: string;
  contactRelation: string;
};

export function ProfileForm({ initial }: { initial: Initial }) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateProfileAction,
    undefined
  );
  const router = useRouter();
  const errors = state?.errors ?? {};

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Card className="flex flex-col gap-5">
        <h2 className="font-semibold text-ink">Account</h2>
        <FormField label="Full name" htmlFor="name" error={errors.name?.[0]}>
          <Input id="name" name="name" defaultValue={initial.name} required />
        </FormField>
        <div className="grid sm:grid-cols-2 gap-5">
          <FormField label="Phone" htmlFor="phone" error={errors.phone?.[0]}>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={initial.phone}
              required
            />
          </FormField>
          <FormField label="Email" htmlFor="email" error={errors.email?.[0]}>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={initial.email}
              required
            />
          </FormField>
        </div>
      </Card>

      <Card className="flex flex-col gap-5">
        <h2 className="font-semibold text-ink">Household</h2>
        <FormField
          label="Household location"
          htmlFor="locationText"
          error={errors.locationText?.[0]}
          hint="Neighbourhood/area — used to match nearby nurses."
        >
          <Input
            id="locationText"
            name="locationText"
            defaultValue={initial.locationText}
            required
          />
        </FormField>
      </Card>

      <Card className="flex flex-col gap-5">
        <h2 className="font-semibold text-ink">Patient</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <FormField
            label="Patient's name"
            htmlFor="patientName"
            error={errors.patientName?.[0]}
          >
            <Input
              id="patientName"
              name="patientName"
              defaultValue={initial.patientName}
              required
            />
          </FormField>
          <FormField
            label="Patient's condition"
            htmlFor="conditionSummary"
            error={errors.conditionSummary?.[0]}
          >
            <Input
              id="conditionSummary"
              name="conditionSummary"
              defaultValue={initial.conditionSummary}
              required
            />
          </FormField>
        </div>
      </Card>

      <Card className="flex flex-col gap-5">
        <h2 className="font-semibold text-ink">Emergency contact</h2>
        <p className="text-xs text-muted -mt-3">
          Used only for SOS alerts during a booking. Leave blank if you&apos;d
          rather set this during your first booking.
        </p>
        <div className="grid sm:grid-cols-3 gap-5">
          <FormField
            label="Name"
            htmlFor="contactName"
            error={errors.contactName?.[0]}
          >
            <Input
              id="contactName"
              name="contactName"
              defaultValue={initial.contactName}
            />
          </FormField>
          <FormField label="Relationship" htmlFor="contactRelation">
            <Input
              id="contactRelation"
              name="contactRelation"
              defaultValue={initial.contactRelation}
              placeholder="Son"
            />
          </FormField>
          <FormField label="Phone" htmlFor="contactPhone">
            <Input
              id="contactPhone"
              name="contactPhone"
              defaultValue={initial.contactPhone}
              placeholder="+91 98xxxxxxxx"
            />
          </FormField>
        </div>
      </Card>

      {state?.ok && state.message && (
        <p className="text-sm text-success">{state.message}</p>
      )}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
