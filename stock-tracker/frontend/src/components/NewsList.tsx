"use client";

import { IconExternalLink, IconClock } from "@/lib/icons";
import { formatNewsTime } from "@/lib/utils";

export interface NewsItem {
  title: string;
  source: string;
  link: string;
  publishedAt: string | null;
}

interface NewsListProps {
  news: NewsItem[];
  loading?: boolean;
  emptyMessage?: string;
  skeletonCount?: number;
}

export default function NewsList({
  news,
  loading = false,
  emptyMessage = "No recent news found.",
  skeletonCount = 4,
}: NewsListProps) {
  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading news">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-900 border border-gray-800 rounded-xl p-3 animate-pulse"
          >
            <div className="h-3.5 w-4/5 bg-gray-800 rounded mb-2" />
            <div className="h-3 w-1/3 bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!news.length) {
    return <p className="text-sm text-gray-500 text-center py-6">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-2">
      {news.map((item, i) => (
        <li key={i}>
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${item.title} — ${item.source}, opens in a new tab`}
            className="group flex items-start justify-between gap-3 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-3 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm text-white font-medium leading-snug group-hover:text-emerald-400 transition-colors">
                {item.title}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                <span className="font-medium text-gray-400">{item.source}</span>
                {item.publishedAt && (
                  <>
                    <span aria-hidden="true">·</span>
                    <IconClock size={11} aria-hidden="true" />
                    <span>{formatNewsTime(item.publishedAt)}</span>
                  </>
                )}
              </div>
            </div>
            <IconExternalLink
              size={14}
              className="text-gray-600 group-hover:text-gray-400 shrink-0 mt-0.5 transition-colors"
              aria-hidden="true"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
