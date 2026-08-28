import type { Metadata } from "next";
import { ContactPageClient } from "@/components/marketing/contact-page-client";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Contact",
  description: "Contact Masareefy team for support and feedback.",
  path: "/contact",
});

export default function ContactPage() {
  return <ContactPageClient />;
}
