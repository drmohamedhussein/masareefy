import type { Metadata } from "next";
import { HomePageClient } from "@/components/marketing/home-page-client";
import { createPageMetadata } from "@/lib/seo/metadata";
import { SITE } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "Free expense tracker",
  description: SITE.description,
  path: "/",
});

export default function HomePage() {
  return <HomePageClient />;
}
