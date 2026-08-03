"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import posthog from "posthog-js";

function PostHogInit() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || posthog.__loaded) return; // stubbed: no-op without a real key
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: true,
    });
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PostHogInit />
      {children}
    </SessionProvider>
  );
}
