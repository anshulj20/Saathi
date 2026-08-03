export const SPECIALIZATIONS = [
  "Elderly care",
  "Dementia care",
  "Post-operative care",
  "Mobility assistance",
  "Companionship",
  "Palliative care",
] as const;

export type Specialization = (typeof SPECIALIZATIONS)[number];

export const GENDERS = ["male", "female", "other"] as const;
