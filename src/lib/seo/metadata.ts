import type { Metadata } from "next";
import { SITE, absoluteUrl } from "./site";

export function createPageMetadata(input: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  const url = absoluteUrl(input.path);
  return {
    title: input.title,
    description: input.description,
    keywords: [...SITE.keywords, ...(input.keywords ?? [])],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: SITE.locale,
      url,
      siteName: SITE.name,
      title: `${input.title} | ${SITE.name}`,
      description: input.description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${input.title} | ${SITE.name}`,
      description: input.description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}

export function webApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE.name,
    alternateName: SITE.nameAr,
    url: SITE.url,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web, Android, iOS",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EGP",
    },
    description: SITE.description,
    inLanguage: SITE.language,
    isAccessibleForFree: true,
    browserRequirements: "Requires JavaScript. Supports RTL Arabic.",
    featureList: [
      "تتبع المصروفات اليومية",
      "وسوم وتصنيفات",
      "اشتراكات وتجديدات مع تذكيرات",
      "مزامنة Google Sheets و Calendar",
      "مزامنة Notion",
      "تخزين محلي على الجهاز",
      "مجاني 100%",
    ],
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
  };
}

export function faqJsonLd(
  items: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
