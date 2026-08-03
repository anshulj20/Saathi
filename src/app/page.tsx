import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { buttonClasses } from "@/lib/ui";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const roleHome: Record<string, string> = {
  customer: "/search",
  nurse: "/dashboard",
  admin: "/admin/vetting",
};

const steps = [
  {
    n: 1,
    title: "Search & Filter",
    body: "Find nurses by specialization, rating and price, near your family.",
  },
  {
    n: 2,
    title: "Book & Pay",
    body: "Choose your dates, share care instructions, pay securely by UPI.",
  },
  {
    n: 3,
    title: "Care with Confidence",
    body: "Tracked shifts, an SOS safety net, and a rating after every visit.",
  },
];

const testimonials = [
  {
    quote:
      "When my mother-in-law needed care during our trip, I could actually see who was coming — her training, her rating, everything.",
    author: "Meera K., Bengaluru",
  },
  {
    quote:
      "I finally get matched to patients that fit my specialization, and I'm paid what the work is actually worth.",
    author: "Divya N., Nurse",
  },
];

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect(roleHome[session.user.role] ?? "/");
  }

  return (
    <div>
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
        <div className="flex flex-col gap-6">
          <Badge tone="primary" className="w-fit uppercase tracking-wide">
            Verified home nursing
          </Badge>
          <h1 className="font-serif text-4xl md:text-[50px] leading-[1.1] font-semibold text-ink">
            Trustworthy care, the moment your family needs it.
          </h1>
          <p className="text-muted text-lg leading-relaxed max-w-xl">
            Book a pre-vetted, specialization-matched nurse for a few hours
            or a few days — no bureau contracts, no ad-hoc phone calls, no
            guesswork about who&apos;s walking into your home.
          </p>
          <div className="flex flex-wrap gap-3.5 mt-2">
            <Link href="/signup?role=customer" className={buttonClasses("primary")}>
              Book a Nurse
            </Link>
            <Link href="/signup?role=nurse" className={buttonClasses("secondary")}>
              Join as a Nurse
            </Link>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted mt-1">
            <span>✓ Manually verified</span>
            <span>✓ Pay by UPI</span>
            <span>✓ SOS safety net</span>
          </div>
        </div>

        <div
          aria-hidden
          className="rounded-2xl h-72 md:h-full min-h-[320px] bg-gradient-to-br from-primary-tint via-cream to-primary/20 border border-border flex items-center justify-center"
        >
          <span className="font-serif text-primary-dark/60 text-xl px-8 text-center">
            A nurse caring for an elder family member, at home
          </span>
        </div>
      </section>

      <section className="bg-white border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="font-serif text-3xl font-semibold text-ink mb-10">
            How Saathi works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.n} className="flex flex-col gap-3">
                <span className="w-9 h-9 rounded-full bg-primary-tint text-primary-darker flex items-center justify-center font-bold">
                  {step.n}
                </span>
                <h3 className="font-semibold text-ink">{step.title}</h3>
                <p className="text-muted text-sm leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-serif text-3xl font-semibold text-ink mb-10">
          Families who trust Saathi
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t) => (
            <Card key={t.author}>
              <p className="text-ink-soft leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </p>
              <p className="mt-4 text-sm text-muted font-medium">
                {t.author}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
