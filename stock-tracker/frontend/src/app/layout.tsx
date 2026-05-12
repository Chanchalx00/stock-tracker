import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const geist = Geist({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),

  title: {
    default: "Stocklytics — Stock Market Tracker",
    template: "%s | Stocklytics",
  },
  description:
    "Track real-time stock prices, set price alerts, manage your watchlist and portfolio P&L — all in one place.",

  openGraph: {
    type: "website",
    siteName: "Stocklytics",
    title: "Stocklytics — Stock Market Tracker",
    description:
      "Real-time stock tracking, alerts, watchlist, and portfolio P&L.",
    locale: "en_US",
  },

  twitter: {
    card: "summary",
    title: "Stocklytics",
    description: "Real-time stock alerts and portfolio tracker.",
  },

  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },

  icons: {
    icon: "/favicon.ico",
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
          <div id="main-content">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
