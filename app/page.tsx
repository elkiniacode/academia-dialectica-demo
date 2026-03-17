import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PublicNavbar } from "@/components/welcome/public-navbar";
import { HeroSection } from "@/components/welcome/hero-section";
import { FeaturesSection } from "@/components/welcome/features-section";
import { ModalitiesSection } from "@/components/welcome/modalities-section";
import { TestimonialsSection } from "@/components/welcome/testimonials-section";
import { StoriesSection } from "@/components/welcome/stories-section";
import { Footer } from "@/components/welcome/footer";

export const revalidate = 3600;

const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  alternates: { canonical: "/" },
  title: "Clases Particulares - Tutoría Personalizada | Academia Dialéctica",
  description:
    "Clases particulares y tutoría personalizada para estudiantes de todos los niveles. Aprende a tu ritmo con atención individualizada.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Clases Particulares - Tutoría Personalizada | Academia Dialéctica",
    description:
      "Clases particulares y tutoría personalizada para estudiantes de todos los niveles. Aprende a tu ritmo con atención individualizada.",
    type: "website",
    locale: "es_CO",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Academia Dialéctica - Tutoría Personalizada",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clases Particulares - Tutoría Personalizada | Academia Dialéctica",
    description:
      "Clases particulares y tutoría personalizada para estudiantes de todos los niveles. Aprende a tu ritmo con atención individualizada.",
    images: ["/api/og"],
  },
};

export default async function WelcomePage() {
  const [testimonials, stories] = await Promise.all([
    prisma.testimonial.findMany({
      where: { visible: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.story.findMany({
      where: { visible: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const rated = testimonials.filter((t) => t.rating != null);
  const avgRating =
    rated.length > 0
      ? (rated.reduce((sum, t) => sum + t.rating!, 0) / rated.length).toFixed(1)
      : "5";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Academia Dialéctica",
    description:
      "Tutoría personalizada y clases particulares para estudiantes de todos los niveles en Colombia.",
    url: baseUrl,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bogotá",
      addressCountry: "CO",
    },
    ...(testimonials.length > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating,
        reviewCount: testimonials.length.toString(),
      },
      review: testimonials.slice(0, 3).map((t) => ({
        "@type": "Review",
        author: { "@type": "Person", name: t.clientName },
        reviewBody: t.content,
        reviewRating: {
          "@type": "Rating",
          ratingValue: (t.rating ?? 5).toString(),
        },
      })),
    }),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Servicios de Tutoría",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Clases de Matemáticas",
            description:
              "Cálculo, Álgebra y Estadística para niveles Bachillerato y Universidad.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Clases de Física",
            description:
              "Mecánica, Termodinámica y Electromagnetismo para Bachillerato y Universidad.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Clases de Química",
            description:
              "Química General y Orgánica para estudiantes de Bachillerato y Universidad.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Tutoría Personalizada",
            description:
              "Atención individualizada adaptada al ritmo y necesidades de cada estudiante.",
          },
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicNavbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ModalitiesSection />
        <TestimonialsSection testimonials={testimonials} />
        <StoriesSection stories={stories} />
        <Footer />
      </main>
    </>
  );
}
