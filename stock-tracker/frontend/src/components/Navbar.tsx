'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navLinks = [
  { href: '/dashboard', label: 'Search' },
  { href: '/watchlist', label: 'Watchlist' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/portfolio', label: 'Portfolio' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link
              href="/dashboard"
              className="text-emerald-400 font-bold text-lg tracking-tight"
            >
              Stocklytics
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm text-gray-400">
                {user?.name}
              </span>

              <button
                onClick={logout}
                className="text-sm px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-300 hover:bg-gray-800 z-50"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          mobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <div
        className={`fixed top-0 left-0 h-full w-72 bg-gray-950 border-r border-gray-800 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-emerald-400 font-bold text-lg">
            Stocklytics
          </h2>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-md text-gray-400 hover:bg-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="text-sm text-gray-400 mb-4">
            {user?.name}
          </div>

          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <button
            onClick={logout}
            className="w-full mt-6 text-sm px-3 py-2 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors text-left"
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
}