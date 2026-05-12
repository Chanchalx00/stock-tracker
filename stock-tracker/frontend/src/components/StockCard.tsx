import { cn, formatPrice, formatVolume } from "@/lib/utils";
import { ChangeBadge } from "@/components/ui/Badge";
import { IconArrowUp, IconArrowDown, IconVolume } from "@/lib/icons";

interface StockCardProps {
  symbol: string;
  companyName?: string;
  currentPrice?: number | null;
  percentChange?: number | null;
  high?: number;
  low?: number;
  volume?: number;
  children?: React.ReactNode;
  className?: string;
  asArticle?: boolean;
}

export default function StockCard({
  symbol,
  companyName,
  currentPrice,
  percentChange,
  high,
  low,
  volume,
  children,
  className,
  asArticle = false,
}: StockCardProps) {
  const inner = (
    <div
      className={cn(
        "bg-gray-900 border border-gray-800 rounded-xl p-4",
        "hover:border-gray-700 transition-colors duration-200",
        className,
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 mr-2">
          <h3 className="font-bold text-white text-base leading-tight">
            {symbol}
          </h3>
          {companyName && (
            <p className="text-xs text-gray-500 truncate mt-0.5 max-w-[160px]">
              {companyName}
            </p>
          )}
        </div>

        <div className="text-right shrink-0">
          {currentPrice != null ? (
            <>
              <p
                className="text-white font-bold text-base"
                aria-label={`Current price ${formatPrice(currentPrice)}`}
              >
                {formatPrice(currentPrice)}
              </p>
              <ChangeBadge value={percentChange ?? null} />
            </>
          ) : (
            <span className="text-gray-600 text-xs" aria-label="Price loading">
              Loading…
            </span>
          )}
        </div>
      </div>

      {(high != null || low != null || volume != null) && (
        <dl
          className="flex flex-wrap gap-3 text-xs mb-3"
          aria-label="Day statistics"
        >
          {high != null && (
            <div className="flex items-center gap-1">
              <IconArrowUp
                size={11}
                aria-hidden="true"
                className="text-emerald-400"
              />
              <dt className="text-gray-500">H</dt>
              <dd className="text-gray-300 font-medium">{formatPrice(high)}</dd>
            </div>
          )}
          {low != null && (
            <div className="flex items-center gap-1">
              <IconArrowDown
                size={11}
                aria-hidden="true"
                className="text-red-400"
              />
              <dt className="text-gray-500">L</dt>
              <dd className="text-gray-300 font-medium">{formatPrice(low)}</dd>
            </div>
          )}
          {volume != null && (
            <div className="flex items-center gap-1">
              <IconVolume
                size={11}
                aria-hidden="true"
                className="text-gray-500"
              />
              <dt className="text-gray-500">Vol</dt>
              <dd className="text-gray-300 font-medium">
                {formatVolume(volume)}
              </dd>
            </div>
          )}
        </dl>
      )}

      {children}
    </div>
  );

  if (asArticle) {
    return <article aria-label={`${symbol} stock card`}>{inner}</article>;
  }
  return inner;
}
