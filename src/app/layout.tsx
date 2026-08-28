import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { SerwistProvider } from "@/components/pwa/serwist-provider";
import { InstallAppBanner } from "@/components/pwa/install-app-banner";
import "./globals.css";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

const APP_NAME = "مصاريفي";
const APP_DESCRIPTION =
  "تطبيق عربي لتتبع المصروفات الشخصية بواجهة شبيهة بـ Notion — قابل للتثبيت على الجهاز";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#2f6fed",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${ibmPlexArabic.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full font-sans" suppressHydrationWarning>
        <SerwistProvider swUrl="/serwist/sw.js">
          <InstallAppBanner />
          {children}
        </SerwistProvider>
      </body>
    </html>
  );
}
