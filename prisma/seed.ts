import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!email || !passwordHash) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD_HASH must be set in .env.local"
    );
  }

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      role: "admin",
      name: "Saathi Admin",
      phone: "0000000000",
      email,
      passwordHash,
      status: "active",
    },
  });

  console.log(`Admin user ready: ${email}`);
}

const DEMO_PASSWORD = "demo1234";

const DEMO_NURSES = [
  {
    name: "Anitha Suresh",
    phone: "+919800000001",
    email: "anitha.suresh@demo.saathi.app",
    specializations: ["Elderly care", "Dementia care", "Post-operative care"],
    experienceYears: 6,
    pricePerDay: 1100,
    gender: "female" as const,
    locationText: "Indiranagar, Bengaluru",
    bio: "Six years caring for elderly patients across Bengaluru, with a focus on dementia and Alzheimer's support. Calm under pressure, patient with routines.",
  },
  {
    name: "Priya Ramesh",
    phone: "+919800000002",
    email: "priya.ramesh@demo.saathi.app",
    specializations: ["Dementia care", "Companionship"],
    experienceYears: 4,
    pricePerDay: 950,
    gender: "female" as const,
    locationText: "Koramangala, Bengaluru",
    bio: "B.Sc Nursing graduate focused on companionship-led dementia care.",
  },
  {
    name: "Fathima Beevi",
    phone: "+919800000003",
    email: "fathima.beevi@demo.saathi.app",
    specializations: ["Elderly care", "Palliative care"],
    experienceYears: 9,
    pricePerDay: 1300,
    gender: "female" as const,
    locationText: "Jayanagar, Bengaluru",
    bio: "GNM-qualified with nearly a decade of palliative and elderly care experience.",
  },
  {
    name: "Lakshmi Iyer",
    phone: "+919800000004",
    email: "lakshmi.iyer@demo.saathi.app",
    specializations: ["Post-operative care", "Mobility assistance"],
    experienceYears: 3,
    pricePerDay: 1000,
    gender: "female" as const,
    locationText: "Whitefield, Bengaluru",
    bio: "Specializes in post-surgery recovery and mobility support.",
  },
  {
    name: "Rohan Nair",
    phone: "+919800000005",
    email: "rohan.nair@demo.saathi.app",
    specializations: ["Mobility assistance", "Elderly care"],
    experienceYears: 5,
    pricePerDay: 1050,
    gender: "male" as const,
    locationText: "HSR Layout, Bengaluru",
    bio: "Physiotherapy-trained nurse focused on mobility and rehabilitation support for elderly patients.",
  },
  {
    name: "Deepa Menon",
    phone: "+919800000006",
    email: "deepa.menon@demo.saathi.app",
    specializations: ["Companionship", "Palliative care"],
    experienceYears: 7,
    pricePerDay: 1150,
    gender: "female" as const,
    locationText: "Indiranagar, Bengaluru",
    bio: "Focuses on companionship-led palliative care, helping families navigate end-of-life care with dignity.",
  },
  {
    name: "Suresh Kumar",
    phone: "+919800000007",
    email: "suresh.kumar@demo.saathi.app",
    specializations: ["Elderly care", "Companionship"],
    experienceYears: 8,
    pricePerDay: 1000,
    gender: "male" as const,
    locationText: "Koramangala, Bengaluru",
    bio: "Eight years supporting elderly patients living alone, with an emphasis on daily routine and companionship.",
  },
  {
    name: "Kavya Pillai",
    phone: "+919800000008",
    email: "kavya.pillai@demo.saathi.app",
    specializations: ["Dementia care", "Palliative care"],
    experienceYears: 5,
    pricePerDay: 1200,
    gender: "female" as const,
    locationText: "Whitefield, Bengaluru",
    bio: "Trained in dementia-specific palliative care, with a gentle, structured approach to daily care.",
  },
  {
    name: "Arjun Varma",
    phone: "+919800000009",
    email: "arjun.varma@demo.saathi.app",
    specializations: ["Post-operative care", "Companionship"],
    experienceYears: 4,
    pricePerDay: 1050,
    gender: "male" as const,
    locationText: "Jayanagar, Bengaluru",
    bio: "Supports patients through post-surgery recovery with a focus on mobility milestones and emotional support.",
  },
  {
    name: "Meera Joseph",
    phone: "+919800000010",
    email: "meera.joseph@demo.saathi.app",
    specializations: ["Mobility assistance", "Palliative care"],
    experienceYears: 6,
    pricePerDay: 1100,
    gender: "other" as const,
    locationText: "HSR Layout, Bengaluru",
    bio: "Combines physiotherapy training with palliative care experience for patients with limited mobility.",
  },
  {
    name: "Ravi Shankar",
    phone: "+919800000011",
    email: "ravi.shankar@demo.saathi.app",
    specializations: ["Elderly care", "Post-operative care"],
    experienceYears: 10,
    pricePerDay: 1250,
    gender: "male" as const,
    locationText: "Indiranagar, Bengaluru",
    bio: "A decade of experience across elderly care and post-surgical recovery in home settings.",
  },
  {
    name: "Nandini Rao",
    phone: "+919800000012",
    email: "nandini.rao@demo.saathi.app",
    specializations: ["Companionship", "Dementia care"],
    experienceYears: 3,
    pricePerDay: 900,
    gender: "female" as const,
    locationText: "Koramangala, Bengaluru",
    bio: "Warm, patient approach to companionship care for early-stage dementia patients.",
  },
] as const;

async function seedDemoNurses() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const nurse of DEMO_NURSES) {
    await prisma.user.upsert({
      where: { email: nurse.email },
      update: {},
      create: {
        role: "nurse",
        name: nurse.name,
        phone: nurse.phone,
        email: nurse.email,
        passwordHash,
        status: "active",
        nurseProfile: {
          create: {
            specializations: [...nurse.specializations],
            experienceYears: nurse.experienceYears,
            pricePerDay: nurse.pricePerDay,
            gender: nurse.gender,
            locationText: nurse.locationText,
            bio: nurse.bio,
          },
        },
      },
    });
  }

  console.log(`${DEMO_NURSES.length} demo nurses ready (password: ${DEMO_PASSWORD})`);
}

const DEMO_CUSTOMERS = [
  {
    name: "Sanjana Rao",
    phone: "+919800002001",
    email: "sanjana.rao@demo.saathi.app",
    locationText: "Jayanagar, Bengaluru",
    patientName: "Radha Rao",
    conditionSummary: "Recovering from a fall, needs mobility supervision",
  },
  {
    name: "Karthik Subramaniam",
    phone: "+919800002002",
    email: "karthik.s@demo.saathi.app",
    locationText: "Whitefield, Bengaluru",
    patientName: "Subramaniam Iyer",
    conditionSummary: "Type 2 diabetes management and companionship",
  },
  {
    name: "Ananya Desai",
    phone: "+919800002003",
    email: "ananya.desai@demo.saathi.app",
    locationText: "HSR Layout, Bengaluru",
    patientName: "Kamala Desai",
    conditionSummary: "Advanced dementia care",
  },
] as const;

// Pre-activated (status: active) so they're ready to log in and use
// immediately — no admin vetting step needed for these demo accounts.
async function seedDemoCustomers() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const customer of DEMO_CUSTOMERS) {
    await prisma.user.upsert({
      where: { email: customer.email },
      update: {},
      create: {
        role: "customer",
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        passwordHash,
        status: "active",
        customerProfile: { create: { locationText: customer.locationText } },
        patientProfile: {
          create: {
            patientName: customer.patientName,
            conditionSummary: customer.conditionSummary,
          },
        },
      },
    });
  }

  console.log(`${DEMO_CUSTOMERS.length} demo customers ready (password: ${DEMO_PASSWORD})`);
}

// Search now filters by real-time availability, so demo nurses need actual
// AvailabilitySlot rows or they'd never show up in search results.
async function seedDemoAvailability() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  for (const nurse of DEMO_NURSES) {
    const nurseUser = await prisma.user.findUniqueOrThrow({
      where: { email: nurse.email },
    });

    const existing = await prisma.availabilitySlot.count({
      where: { nurseUserId: nurseUser.id },
    });
    if (existing > 0) continue;

    const slots = Array.from({ length: 14 }, (_, day) => {
      const dayStart = new Date(todayStart.getTime() + day * 24 * 60 * 60 * 1000);
      return {
        nurseUserId: nurseUser.id,
        status: "available" as const,
        startTime: new Date(dayStart.getTime() + 6 * 60 * 60 * 1000), // 6am
        endTime: new Date(dayStart.getTime() + 22 * 60 * 60 * 1000), // 10pm
      };
    });

    await prisma.availabilitySlot.createMany({ data: slots });
  }

  console.log("Demo nurse availability seeded (next 14 days, 6am-10pm daily).");
}

const DEMO_REVIEWERS = [
  {
    name: "Meera Krishnan",
    phone: "+919800001001",
    email: "meera.krishnan@demo.saathi.app",
    locationText: "Indiranagar, Bengaluru",
    patientName: "Lakshmi Krishnan",
    conditionSummary: "Early-stage Alzheimer's",
  },
  {
    name: "Rohan Sharma",
    phone: "+919800001002",
    email: "rohan.sharma@demo.saathi.app",
    locationText: "Koramangala, Bengaluru",
    patientName: "Vijay Sharma",
    conditionSummary: "Post-knee-surgery recovery",
  },
] as const;

// Real completed bookings + ratings backing each nurse's rating_avg/rating_count,
// so those cached fields are never out of sync with actual Rating rows.
const DEMO_REVIEWS: {
  nurseEmail: string;
  reviewerEmail: string;
  stars: number;
  feedback: string;
}[] = [
  {
    nurseEmail: "anitha.suresh@demo.saathi.app",
    reviewerEmail: "meera.krishnan@demo.saathi.app",
    stars: 5,
    feedback:
      "Extremely patient with my mother-in-law and kept us updated the whole time.",
  },
  {
    nurseEmail: "anitha.suresh@demo.saathi.app",
    reviewerEmail: "rohan.sharma@demo.saathi.app",
    stars: 5,
    feedback: "Arrived early, very professional, followed the care instructions closely.",
  },
  {
    nurseEmail: "anitha.suresh@demo.saathi.app",
    reviewerEmail: "meera.krishnan@demo.saathi.app",
    stars: 4,
    feedback: "Good overall experience, would book again.",
  },
  {
    nurseEmail: "priya.ramesh@demo.saathi.app",
    reviewerEmail: "meera.krishnan@demo.saathi.app",
    stars: 5,
    feedback: "Very warm with my father, he looks forward to her visits.",
  },
  {
    nurseEmail: "priya.ramesh@demo.saathi.app",
    reviewerEmail: "rohan.sharma@demo.saathi.app",
    stars: 4,
    feedback: "Solid experience overall, communicated well.",
  },
  {
    nurseEmail: "fathima.beevi@demo.saathi.app",
    reviewerEmail: "meera.krishnan@demo.saathi.app",
    stars: 5,
    feedback: "Her experience really shows. Completely trust her with my mother's care.",
  },
  {
    nurseEmail: "fathima.beevi@demo.saathi.app",
    reviewerEmail: "rohan.sharma@demo.saathi.app",
    stars: 5,
    feedback: "Calm, capable, and incredibly kind during a difficult time.",
  },
  {
    nurseEmail: "lakshmi.iyer@demo.saathi.app",
    reviewerEmail: "rohan.sharma@demo.saathi.app",
    stars: 5,
    feedback: "Helped my father regain confidence walking again after surgery.",
  },
  {
    nurseEmail: "lakshmi.iyer@demo.saathi.app",
    reviewerEmail: "meera.krishnan@demo.saathi.app",
    stars: 4,
    feedback: "Reliable and on time every shift.",
  },
  {
    nurseEmail: "rohan.nair@demo.saathi.app",
    reviewerEmail: "meera.krishnan@demo.saathi.app",
    stars: 5,
    feedback: "Great with mobility exercises, very encouraging throughout.",
  },
  {
    nurseEmail: "rohan.nair@demo.saathi.app",
    reviewerEmail: "rohan.sharma@demo.saathi.app",
    stars: 4,
    feedback: "Professional and punctual.",
  },
  {
    nurseEmail: "deepa.menon@demo.saathi.app",
    reviewerEmail: "meera.krishnan@demo.saathi.app",
    stars: 5,
    feedback: "So much warmth and patience — made a hard time easier for the whole family.",
  },
  {
    nurseEmail: "suresh.kumar@demo.saathi.app",
    reviewerEmail: "rohan.sharma@demo.saathi.app",
    stars: 5,
    feedback: "My father genuinely enjoys his company, not just care — real companionship.",
  },
  {
    nurseEmail: "kavya.pillai@demo.saathi.app",
    reviewerEmail: "meera.krishnan@demo.saathi.app",
    stars: 5,
    feedback: "Structured, gentle, and very knowledgeable about dementia care specifically.",
  },
  {
    nurseEmail: "arjun.varma@demo.saathi.app",
    reviewerEmail: "rohan.sharma@demo.saathi.app",
    stars: 4,
    feedback: "Kept recovery on track and was encouraging throughout.",
  },
  {
    nurseEmail: "meera.joseph@demo.saathi.app",
    reviewerEmail: "meera.krishnan@demo.saathi.app",
    stars: 5,
    feedback: "Excellent with mobility support, very attentive and kind.",
  },
  {
    nurseEmail: "ravi.shankar@demo.saathi.app",
    reviewerEmail: "rohan.sharma@demo.saathi.app",
    stars: 5,
    feedback: "A decade of experience really shows — extremely competent and calm.",
  },
  {
    nurseEmail: "nandini.rao@demo.saathi.app",
    reviewerEmail: "meera.krishnan@demo.saathi.app",
    stars: 4,
    feedback: "Warm and patient, my mother took to her quickly.",
  },
];

async function seedDemoReviews() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const reviewer of DEMO_REVIEWERS) {
    await prisma.user.upsert({
      where: { email: reviewer.email },
      update: {},
      create: {
        role: "customer",
        name: reviewer.name,
        phone: reviewer.phone,
        email: reviewer.email,
        passwordHash,
        status: "active",
        customerProfile: { create: { locationText: reviewer.locationText } },
        patientProfile: {
          create: {
            patientName: reviewer.patientName,
            conditionSummary: reviewer.conditionSummary,
          },
        },
      },
    });
  }

  // Skip re-seeding a review that already exists (re-running the seed
  // shouldn't duplicate it) — checked per-review so adding new entries to
  // DEMO_REVIEWS doesn't re-create the ones already seeded.
  const existingFeedback = new Set(
    (
      await prisma.rating.findMany({
        where: { feedbackText: { in: DEMO_REVIEWS.map((r) => r.feedback) } },
        select: { feedbackText: true },
      })
    ).map((r) => r.feedbackText)
  );

  let dayOffset = 60;
  for (const review of DEMO_REVIEWS) {
    dayOffset -= 2;
    if (existingFeedback.has(review.feedback)) continue;

    const nurse = await prisma.user.findUniqueOrThrow({
      where: { email: review.nurseEmail },
    });
    const reviewer = await prisma.user.findUniqueOrThrow({
      where: { email: review.reviewerEmail },
      include: { patientProfile: true },
    });
    if (!reviewer.patientProfile) continue;

    const startTime = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 8 * 60 * 60 * 1000);

    const booking = await prisma.booking.create({
      data: {
        customerUserId: reviewer.id,
        nurseUserId: nurse.id,
        patientProfileId: reviewer.patientProfile.id,
        startTime,
        endTime,
        status: "completed",
        careInstructions: "Standard care as discussed.",
        actualStartAt: startTime,
        actualEndAt: endTime,
      },
    });

    await prisma.rating.create({
      data: {
        bookingId: booking.id,
        nurseUserId: nurse.id,
        stars: review.stars,
        feedbackText: review.feedback,
      },
    });
  }

  // Recompute cached rating_avg / rating_count per nurse from real Rating rows,
  // the same way submitRatingAction does after a live rating.
  for (const nurse of DEMO_NURSES) {
    const nurseUser = await prisma.user.findUniqueOrThrow({
      where: { email: nurse.email },
    });
    const agg = await prisma.rating.aggregate({
      where: { nurseUserId: nurseUser.id },
      _avg: { stars: true },
      _count: { stars: true },
    });
    await prisma.nurseProfile.update({
      where: { userId: nurseUser.id },
      data: {
        ratingAvg: agg._avg.stars ?? 0,
        ratingCount: agg._count.stars,
      },
    });
  }

  console.log(`${DEMO_REVIEWS.length} demo reviews seeded.`);
}

async function main() {
  await seedAdmin();
  await seedDemoNurses();
  await seedDemoAvailability();
  await seedDemoReviews();
  await seedDemoCustomers();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
