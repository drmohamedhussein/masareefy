import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <MarketingHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
