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

  // Skip re-seeding if reviews already exist (re-running the seed shouldn't duplicate).
  const alreadySeeded = await prisma.rating.count({
    where: { feedbackText: { in: DEMO_REVIEWS.map((r) => r.feedback) } },
  });
  if (alreadySeeded >= DEMO_REVIEWS.length) {
    console.log("Demo reviews already seeded, skipping.");
    return;
  }

  let dayOffset = 30;
  for (const review of DEMO_REVIEWS) {
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
    dayOffset -= 2;

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
  await seedDemoReviews();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
