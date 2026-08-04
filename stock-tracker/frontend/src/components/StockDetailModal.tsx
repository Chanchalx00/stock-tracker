"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatPrice, formatPct, formatVolume } from "@/lib/utils";
import { ChangeBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import NewsList, { NewsItem } from "@/components/NewsList";
import StockAvatar from "@/components/StockAvatar";
import PriceChart, { OhlcPoint } from "@/components/PriceChart";
import {
  IconClose,
  IconArrowUp,
  IconArrowDown,
  IconMinus,
  IconVolume,
  IconDollar,
  IconBarChart,
  IconBookmarkAdd,
  IconBellAdd,
  IconActivity,
  IconTarget,
  IconPercent,
  IconNews,
  IconLineChart,
} from "@/lib/icons";
import type { LucideIcon } from "lucide-react";
import api from "@/lib/api";

interface StockDetail {
  symbol: string;
  name?: string;
  currentPrice: number;
  high: number;
  low: number;
  open: number;
  prevClose?: number;
  volume: number;
  change: number;
  percentChange: number;
}

interface StockDetailModalProps {
  stock: StockDetail | null;
  onClose: () => void;
  onAddWatchlist?: (symbol: string, name: string) => void;
  onCreateAlert?: (symbol: string) => void;
}

interface StatRowItem {
  label: string;
  value: string;
  Icon: LucideIcon;
  colored: boolean;
}


export default function StockDetailModal({
  stock,
  onClose,
  onAddWatchlist,
  onCreateAlert,
}: StockDetailModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const isPositive = (stock?.percentChange ?? 0) >= 0;

  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  const [chartPoints, setChartPoints] = useState<OhlcPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    if (!stock) return;

    let cancelled = false;
    setNewsLoading(true);
    setNews([]);

    api
      .get(`/news/stock/${encodeURIComponent(stock.symbol)}`, {
        params: { name: stock.name || stock.symbol },
      })
      .then(({ data }) => {
        if (!cancelled) setNews(data.data || []);
      })
      .catch(() => {
        if (!cancelled) setNews([]);
      })
      .finally(() => {
        if (!cancelled) setNewsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [stock?.symbol, stock?.name]);

  useEffect(() => {
    if (!stock) return;

    let cancelled = false;
    setChartLoading(true);
    setChartPoints([]);

    api
      .get(`/stocks/chart/${encodeURIComponent(stock.symbol)}`)
      .then(({ data }) => {
        if (!cancelled) setChartPoints(data.data?.points || []);
      })
      .catch(() => {
        if (!cancelled) setChartPoints([]);
      })
      .finally(() => {
        if (!cancelled) setChartLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [stock?.symbol]);

  useEffect(() => {
    if (!stock) return;
    closeBtnRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button,[href],input,select,[tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [stock, onClose]);

  if (!stock) return null;

  const stats: StatRowItem[] = [
    {
      label: "Current Price",
      value: formatPrice(stock.currentPrice),
      Icon: IconDollar,
      colored: false,
    },
    {
      label: "Day High",
      value: formatPrice(stock.high),
      Icon: IconArrowUp,
      colored: false,
    },
    {
      label: "Day Low",
      value: formatPrice(stock.low),
      Icon: IconArrowDown,
      colored: false,
    },
    {
      label: "Open",
      value: formatPrice(stock.open),
      Icon: IconActivity,
      colored: false,
    },
    {
      label: "Prev. Close",
      value: formatPrice(stock.prevClose),
      Icon: IconBarChart,
      colored: false,
    },
    {
      label: "Change (₹)",
      value:
        stock.change >= 0
          ? `+${formatPrice(stock.change)}`
          : formatPrice(stock.change),
      Icon: stock.change >= 0 ? IconArrowUp : IconArrowDown,
      colored: true,
    },
    {
      label: "Change (%)",
      value: formatPct(stock.percentChange),
      Icon: IconPercent,
      colored: true,
    },
    {
      label: "Volume",
      value: formatVolume(stock.volume),
      Icon: IconVolume,
      colored: false,
    },
  ];

  const rangeWidth =
    stock.high > stock.low
      ? Math.min(
          100,
          ((stock.currentPrice - stock.low) / (stock.high - stock.low)) * 100,
        )
      : 50;

  return (
    <motion.div
      role="presentation"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm"
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${stock.symbol} stock details`}
        aria-describedby="modal-company"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl"
      >
        <header className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-800">
          <div className="flex items-start gap-3 min-w-0">
            <StockAvatar symbol={stock.symbol} size={44} className="mt-0.5" />
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {stock.symbol}
              </h2>
              {stock.name && (
                <p id="modal-company" className="text-sm text-gray-400 mt-0.5">
                  {stock.name}
                </p>
              )}
            </div>
          </div>

          <div className="text-right pr-8">
            <p
              className="text-2xl font-bold text-white"
              aria-label={`Current price ${formatPrice(stock.currentPrice)}`}
            >
              {formatPrice(stock.currentPrice)}
            </p>
            <div className="mt-1">
              <ChangeBadge value={stock.percentChange} />
            </div>
          </div>

          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close stock details dialog"
            className={cn(
              "absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full",
              "text-gray-500 hover:text-white hover:bg-gray-800 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
            )}
          >
            <IconClose size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 px-6 py-4">
          <section aria-labelledby="stats-title">
            <h3 id="stats-title" className="sr-only">
              Market statistics
            </h3>
            <dl className="grid grid-cols-2 gap-2.5">
              {stats.map(({ label, value, Icon, colored }) => (
                <div key={label} className="bg-gray-800/60 rounded-xl px-3.5 py-3">
                  <dt className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5 font-medium">
                    <Icon
                      size={11}
                      aria-hidden="true"
                      className={
                        colored
                          ? isPositive
                            ? "text-emerald-400"
                            : "text-red-400"
                          : "text-gray-600"
                      }
                    />
                    {label}
                  </dt>
                  <dd
                    className={cn(
                      "text-sm font-semibold",
                      colored
                        ? isPositive
                          ? "text-emerald-400"
                          : "text-red-400"
                        : "text-white",
                    )}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="chart-title">
            <div className="flex items-center justify-between mb-2">
              <h3
                id="chart-title"
                className="flex items-center gap-1.5 text-xs text-gray-500 font-medium"
              >
                <IconLineChart size={12} aria-hidden="true" />
                Today&apos;s Movement
              </h3>
              {chartLoading && <Spinner size="xs" aria-label="Loading chart" />}
            </div>
            <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-2 h-[190px] flex items-center justify-center">
              {chartLoading ? (
                <div className="w-full h-full animate-pulse bg-gray-800/60 rounded-lg" />
              ) : chartPoints.length > 1 ? (
                <PriceChart
                  points={chartPoints}
                  positive={isPositive}
                  height={174}
                />
              ) : (
                <p className="text-xs text-gray-600">
                  Chart unavailable for {stock.symbol}.
                </p>
              )}
            </div>
          </section>
        </div>

        {stock.high > stock.low && (
          <section aria-label="Day price range" className="px-6 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">Day Range</p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <IconArrowDown
                    size={10}
                    aria-hidden="true"
                    className="text-red-400"
                  />
                  {formatPrice(stock.low)}
                </span>
                <span className="flex items-center gap-1">
                  <IconArrowUp
                    size={10}
                    aria-hidden="true"
                    className="text-emerald-400"
                  />
                  {formatPrice(stock.high)}
                </span>
              </div>
            </div>
            <div
              role="meter"
              aria-label={`Price at ${rangeWidth.toFixed(0)}% of today's range`}
              aria-valuenow={stock.currentPrice}
              aria-valuemin={stock.low}
              aria-valuemax={stock.high}
              className="relative h-2 bg-gray-700 rounded-full overflow-hidden"
            >
              <div
                aria-hidden="true"
                className={cn(
                  "absolute left-0 h-full rounded-full transition-all duration-500",
                  isPositive ? "bg-emerald-500" : "bg-red-500",
                )}
                style={{ width: `${rangeWidth}%` }}
              />
            </div>
          </section>
        )}

        <section aria-labelledby="news-title" className="px-6 pb-4">
          <h3
            id="news-title"
            className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-2"
          >
            <IconNews size={12} aria-hidden="true" />
            Latest News
          </h3>
          <NewsList
            news={news}
            loading={newsLoading}
            emptyMessage={`No recent news found for ${stock.symbol}.`}
            skeletonCount={2}
          />
        </section>

        {(onAddWatchlist || onCreateAlert) && (
          <footer className="px-6 pb-5 flex gap-3">
            {onAddWatchlist && (
              <Button
                variant="secondary"
                fullWidth
                aria-label={`Add ${stock.symbol} to watchlist`}
                leftIcon={<IconBookmarkAdd size={14} />}
                onClick={() => {
                  onAddWatchlist(stock.symbol, stock.name ?? stock.symbol);
                  onClose();
                }}
              >
                Watchlist
              </Button>
            )}
            {onCreateAlert && (
              <Button
                variant="primary"
                fullWidth
                aria-label={`Set a price alert for ${stock.symbol}`}
                leftIcon={<IconBellAdd size={14} />}
                onClick={() => {
                  onCreateAlert(stock.symbol);
                  onClose();
                }}
              >
                Set Alert
              </Button>
            )}
          </footer>
        )}
      </motion.div>
    </motion.div>
  );
}
