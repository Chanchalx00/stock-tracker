import Link from "next/link";
import { IconTrendingUp } from "@/lib/icons";

export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-gray-950 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 mb-8 text-emerald-400 font-bold text-lg"
        >
          <IconTrendingUp size={22} aria-hidden="true" />
          Stocklytics
        </Link>

        <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated {updated}</p>

        <div className="space-y-6 text-sm leading-relaxed text-gray-300 [&_h2]:text-white [&_h2]:font-semibold [&_h2]:text-base [&_h2]:pt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-emerald-400 [&_a]:underline hover:[&_a]:no-underline">
          {children}
        </div>

        <p className="text-gray-600 text-xs mt-10">
          <Link href="/privacy" className="underline hover:no-underline">
            Privacy Policy
          </Link>
          {" · "}
          <Link href="/terms" className="underline hover:no-underline">
            Terms of Service
          </Link>
        </p>
      </div>
    </div>
  );
}
