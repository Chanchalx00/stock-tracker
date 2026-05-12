import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Stocklytics — Market Tracker',
  description: 'Track stocks, set alerts, manage your portfolio',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-950 text-white`}>
        <AuthProvider>
          {children}
          </AuthProvider>
      </body>
    </html>
  );
}