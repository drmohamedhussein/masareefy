import { AppProviders } from "@/components/providers/app-providers";

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders embed>{children}</AppProviders>;
}
