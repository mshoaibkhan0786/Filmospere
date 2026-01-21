import type { Metadata, Viewport } from "next";
import { Suspense } from 'react';
import { Inter } from "next/font/google"; // Switch to Inter as it's standard and clean
import Script from "next/script";

import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ConfigProvider } from "../context/ConfigContext";
import ErrorBoundary from "../components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : new URL('https://filmospere.com');

export const metadata: Metadata = {
  metadataBase: baseUrl,
  title: {
    default: "Filmospere - Discover Movies, Web Series & Anime",
    template: "%s | Filmospere"
  },
  description: "Your ultimate destination for movies, web series, and entertainment. Discover trending content, reviews, and where to watch.",
  openGraph: {
    title: "Filmospere - Discover Movies, Web Series & Anime",
    description: "Your ultimate destination for movies, web series, and entertainment.",
    url: baseUrl,
    siteName: "Filmospere",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.png',
  },
  twitter: {
    card: "summary_large_image",
    title: "Filmospere - Discover Movies, Web Series & Anime",
    description: "Your ultimate destination for movies, web series, and entertainment.",
    creator: "@Filmospere", // Placeholder handle
  },
  other: {
    "p:domain_verify": "17acd70aa3b8f4ec55ee795b81e45c2d"
  }
};

export const viewport: Viewport = {
  themeColor: "#141414",
  width: "device-width",
  initialScale: 1,
};

import { MovieProvider } from "../context/MovieContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${inter.variable}`}>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}

        <ConfigProvider>
          <MovieProvider>

            <ErrorBoundary>
              <Suspense fallback={<div style={{ height: '60px', background: '#000' }}></div>}>
                <Navbar />
              </Suspense>
              <main style={{ minHeight: '100vh' }}>
                {children}
              </main>
              <Footer />
            </ErrorBoundary>
          </MovieProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
