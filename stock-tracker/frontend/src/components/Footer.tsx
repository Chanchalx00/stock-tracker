import Link from "next/link";
import { IconTrendingUp } from "@/lib/icons";
import { siteConfig } from "@/app/config/site";

export default function Footer() {
  const year = new Date().getFullYear();
  const brand = siteConfig.name.split(" — ")[0];

  return (
    <footer className="mt-auto border-t border-gray-800 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <IconTrendingUp
            size={16}
            className="text-emerald-500"
            aria-hidden="true"
          />
          <span className="font-medium text-gray-400">{brand}</span>
          <span className="text-gray-700" aria-hidden="true">
            ·
          </span>
          <span>© {year}</span>
        </div>

        <p className="text-gray-600 text-xs text-center order-last sm:order-none">
          Market data is for informational purposes only and is not
          investment advice.
          <span className="mx-1.5" aria-hidden="true">
            ·
          </span>
          <Link href="/privacy" className="underline hover:no-underline">
            Privacy
          </Link>
          <span className="mx-1.5" aria-hidden="true">
            ·
          </span>
          <Link href="/terms" className="underline hover:no-underline">
            Terms
          </Link>
        </p>

        <p className="text-gray-500 text-sm">
          Made by{" "}
          <span className="text-gray-300 font-medium">
            Chanchal Chourasiya
          </span>
        </p>
      </div>
    </footer>
  );
}
