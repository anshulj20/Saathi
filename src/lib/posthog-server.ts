import { PostHog } from "posthog-node";

// `account_activated` and `payment_confirmed` are triggered by an admin
// acting on someone else's account, so there's no browser session to fire
// them from — captured server-side instead. Everything else fires from
// posthog-js on the client (see src/lib/posthog-events.ts).

let client: PostHog | null | undefined;

function getClient() {
  if (client !== undefined) return client;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
    client = null;
    return client;
  }

  client = new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });
  return client;
}

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const ph = getClient();
  if (!ph) return; // stubbed: no-op until a real key is configured
  ph.capture({ distinctId, event, properties });
  await ph.flush();
}
