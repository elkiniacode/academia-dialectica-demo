import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clases Particulares - Tutoria Personalizada",
  description:
    "Clases particulares y tutoria personalizada para estudiantes de todos los niveles",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="es" className="scroll-smooth">
      <body className="bg-gray-50 min-h-screen">
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
