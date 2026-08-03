import { Card } from "@/components/ui/card";

export default function SupportPage() {
  return (
    <div className="max-w-lg mx-auto w-full px-6 py-16">
      <h1 className="font-serif text-3xl font-semibold text-ink mb-2">
        Support
      </h1>
      <p className="text-muted mb-8">
        Cancellations, no-shows, and disputes are handled directly by our
        team — reach out any time.
      </p>
      <Card className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-muted">Phone</p>
          <p className="text-lg font-semibold text-ink">+91 98xxxxxxxx</p>
        </div>
        <div>
          <p className="text-sm text-muted">WhatsApp</p>
          <p className="text-lg font-semibold text-ink">+91 98xxxxxxxx</p>
        </div>
      </Card>
    </div>
  );
}
