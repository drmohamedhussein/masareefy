import type { Metadata } from "next";
import { FeaturesPageClient } from "@/components/marketing/features-page-client";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Features",
  description: "Masareefy features — expenses, subscriptions, sync, and more. Free and private.",
  path: "/features",
});

export default function FeaturesPage() {
  return <FeaturesPageClient />;
}
