"use client";
import { useEffect, useRef } from "react";
import { cn, formatPrice, formatPct, formatVolume } from "@/lib/utils";
import { ChangeBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
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
} from "@/lib/icons";
import type { LucideIcon } from "lucide-react";

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
      label: "Change ($)",
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
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${stock.symbol} stock details`}
        aria-describedby="modal-company"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
      >
        <header className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {stock.symbol}
            </h2>
            {stock.name && (
              <p id="modal-company" className="text-sm text-gray-400 mt-0.5">
                {stock.name}
              </p>
            )}
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

        <section aria-labelledby="stats-title" className="px-6 py-4">
          <h3 id="stats-title" className="sr-only">
            Market statistics
          </h3>
          <dl className="grid grid-cols-2 gap-2.5">
            {stats.map(({ label, value, Icon, colored }) => (
              <div
                key={label}
                className="bg-gray-800/60 rounded-xl px-3.5 py-3"
              >
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
      </div>
    </div>
  );
}
