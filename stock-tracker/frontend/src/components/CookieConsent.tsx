"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { IconCookie } from "@/lib/icons";

const STORAGE_KEY = "cookie-consent";

export type CookieConsentValue = "accepted" | "necessary";

// The only cookie this app sets today is the httpOnly refreshToken used
// to keep a session alive (see backend/src/controllers/auth.controller.js)
// — strictly necessary, so it's set regardless of the choice made here.
// This banner exists so that if analytics/ads are added later, whatever
// wires them up can gate on getCookieConsent() === "accepted" instead of
// loading unconditionally.
export const getCookieConsent = (): CookieConsentValue | null => {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "accepted" || value === "necessary" ? value : null;
};

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  // Deliberately not a lazy useState initializer: this component is
  // server-rendered first, before localStorage exists, so starting from
  // `false` and only revealing after this effect runs client-side avoids
  // flashing the banner at returning visitors who already made a choice.
  useEffect(() => {
    setVisible(getCookieConsent() === null);
  }, []);

  const choose = (value: CookieConsentValue) => {
    window.localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-live="polite"
          aria-label="Cookie notice"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 sm:px-6 sm:pb-6"
        >
          <div className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-white/15 bg-gray-900/80 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:flex-row sm:items-center">
            <IconCookie
              size={22}
              className="hidden shrink-0 text-emerald-400 sm:block"
              aria-hidden="true"
            />
            <p className="flex-1 text-sm text-gray-300">
              <IconCookie
                size={16}
                className="mr-1.5 inline text-emerald-400 sm:hidden"
                aria-hidden="true"
              />
              We use a strictly necessary cookie to keep you signed in. No
              advertising or tracking cookies are set. Choosing &ldquo;Necessary
              only&rdquo; keeps it that way if we ever add optional analytics.
              Read the{" "}
              <Link href="/privacy" className="underline hover:no-underline">
                Privacy Policy
              </Link>
              .
            </p>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => choose("necessary")}
              >
                Necessary only
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => choose("accepted")}
              >
                Accept all
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
