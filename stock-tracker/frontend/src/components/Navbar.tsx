"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import {
  IconDashboard,
  IconWatchlist,
  IconAlerts,
  IconPortfolio,
  IconTrendingUp,
  IconLogout,
  IconMenu,
  IconClose,
  IconUser,
} from "@/lib/icons";
import type { LucideIcon } from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  Icon: LucideIcon;
}

const NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", Icon: IconDashboard },
  { href: "/watchlist", label: "Watchlist", Icon: IconWatchlist },
  { href: "/alerts", label: "Alerts", Icon: IconAlerts },
  { href: "/portfolio", label: "Portfolio", Icon: IconPortfolio },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <>
      <header role="banner">
        <nav
          aria-label="Main navigation"
          className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/90 backdrop-blur-md"
        >
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14 gap-4">
            <Link
              href="/dashboard"
              aria-label="StockPulse home"
              className={cn(
                "flex items-center gap-2 text-emerald-400 font-bold text-lg tracking-tight shrink-0",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md",
              )}
            >
              <IconTrendingUp size={22} aria-hidden="true" />
              <span>Stocklytics</span>
            </Link>

            <ul
              role="list"
              className="hidden md:flex items-center gap-0.5 overflow-x-auto scrollbar-none"
            >
              {NAV_LINKS.map(({ href, label, Icon }) => {
                const active = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-label={label}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap",
                        "transition-colors duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                        active
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "text-gray-400 hover:text-white hover:bg-gray-800",
                      )}
                    >
                      <Icon size={15} aria-hidden="true" />
                      <span>{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="hidden md:flex items-center gap-3 shrink-0">
              {user && (
                <span
                  aria-label={`Logged in as ${user.name}`}
                  className="text-sm text-gray-400 truncate max-w-[120px]"
                >
                  {user.name}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                aria-label="Log out of your account"
                leftIcon={<IconLogout size={14} />}
                className="hover:bg-red-500/15 hover:text-red-400 focus-visible:ring-red-500"
              >
                Logout
              </Button>
            </div>

            <button
              className={cn(
                "md:hidden flex items-center justify-center w-9 h-9 rounded-lg",
                "text-gray-400 hover:text-white hover:bg-gray-800 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
              )}
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              aria-controls="mobile-drawer"
            >
              <IconMenu size={20} aria-hidden="true" />
            </button>
          </div>
        </nav>
      </header>

      <div
        aria-hidden="true"
        onClick={() => setDrawerOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          drawerOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
      />

      <aside
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-72 bg-gray-950 border-l border-gray-800",
          "flex flex-col transition-transform duration-300 ease-in-out md:hidden",
          drawerOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg tracking-tight">
            <IconTrendingUp size={20} aria-hidden="true" />
            <span>Stocklytics</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation menu"
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg",
              "text-gray-400 hover:text-white hover:bg-gray-800 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
            )}
          >
            <IconClose size={16} aria-hidden="true" />
          </button>
        </div>

        {user && (
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800 shrink-0">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <IconUser
                size={14}
                className="text-emerald-400"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500">Signed in</p>
            </div>
          </div>
        )}

        <nav
          aria-label="Mobile navigation"
          className="flex-1 overflow-y-auto px-3 py-4"
        >
          <ul role="list" className="space-y-1">
            {NAV_LINKS.map(({ href, label, Icon }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-label={label}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium",
                      "transition-colors duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                      active
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "text-gray-400 hover:text-white hover:bg-gray-800",
                    )}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{label}</span>
                    {active && (
                      <span
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-3 py-4 border-t border-gray-800 shrink-0">
          <Button
            variant="ghost"
            size="md"
            fullWidth
            onClick={() => {
              logout();
              setDrawerOpen(false);
            }}
            aria-label="Log out of your account"
            leftIcon={<IconLogout size={16} />}
            className="justify-start hover:bg-red-500/15 hover:text-red-400 focus-visible:ring-red-500"
          >
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}
