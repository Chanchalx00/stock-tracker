import Link from "next/link";
import { IconSearchEmpty, IconDashboard } from "@/lib/icons";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="text-center max-w-sm">
        <div
          aria-hidden="true"
          className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-5"
        >
          <IconSearchEmpty size={32} className="text-gray-500" />
        </div>

        <p className="text-emerald-400 font-bold text-sm tracking-wider mb-2">
          404
        </p>
        <h1 className="text-xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-gray-500 text-sm mb-6">
          The page you&apos;re looking for doesn&apos;t exist or may have
          been moved.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <IconDashboard size={14} aria-hidden="true" />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
