import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { siteConfig } from "@/app/config/site";

const geist = Geist({ subsets: ["latin"], display: "swap" });

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
    <html lang="en" className="dark">
      <body className={`${geist.className} bg-gray-950 text-white antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg focus:font-semibold"
        >
          Skip to main content
        </a>

        <AuthProvider>
          <main id="main-content">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
