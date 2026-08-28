import type { Metadata } from "next";
import { PrivacyPageClient } from "@/components/marketing/privacy-page-client";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy",
  description: "Masareefy privacy policy — your data stays on your device.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return <PrivacyPageClient />;
}
