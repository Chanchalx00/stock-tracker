import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { siteConfig } from "@/app/config/site";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";

const geistSans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),

  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },

  description:
    "Track real-time stock prices, set price alerts, manage your watchlist and portfolio P&L — all in one place.",

  applicationName: siteConfig.name,
  creator: siteConfig.authorName,
  authors: [{ name: siteConfig.authorName }],

  keywords: siteConfig.keywords,

  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: siteConfig.name,
    url: siteConfig.url,
    title: siteConfig.name,
    description:
      "Real-time stock tracking, alerts, watchlist, and portfolio P&L.",
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: "Real-time stock alerts and portfolio tracker.",
    images: [siteConfig.ogImage],
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: siteConfig.iconIco,
    shortcut: siteConfig.iconIco,
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable}`}>
      <body
        className="font-sans bg-gray-950 text-white antialiased min-h-screen flex flex-col"
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg focus:font-semibold"
        >
          Skip to main content
        </a>

        <AuthProvider>
          <main id="main-content" className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}
