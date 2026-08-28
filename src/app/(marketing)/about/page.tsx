import type { Metadata } from "next";
import { AboutPageClient } from "@/components/marketing/about-page-client";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "About",
  description: "Learn about Masareefy — a free, privacy-first expense tracker.",
  path: "/about",
});

export default function AboutPage() {
  return <AboutPageClient />;
}
