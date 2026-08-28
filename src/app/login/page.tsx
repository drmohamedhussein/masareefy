import type { Metadata } from "next";
import LoginPageClient from "./login-page-client";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Sign in",
  description: "Open Masareefy — free expense tracker. No signup required.",
  path: "/login",
});

export default function LoginPage() {
  return <LoginPageClient />;
}
