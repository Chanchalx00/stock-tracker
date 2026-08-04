"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { IconWarning, IconRefresh, IconDashboard } from "@/lib/icons";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="text-center max-w-sm">
        <div
          aria-hidden="true"
          className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-5"
        >
          <IconWarning size={32} className="text-red-400" />
        </div>

        <h1 className="text-xl font-bold text-white mb-2">
          Something went wrong
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          An unexpected error occurred while loading this page. You can try
          again or head back to the dashboard.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <IconRefresh size={14} aria-hidden="true" />
            Try again
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <IconDashboard size={14} aria-hidden="true" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
