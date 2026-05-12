interface StockCardProps {
  symbol: string;
  currentPrice?: number | null;
  percentChange?: number | null;
  high?: number;
  low?: number;
  children?: React.ReactNode;
}

export default function StockCard({ symbol, currentPrice, percentChange, high, low, children }: StockCardProps) {
  const isPositive = (percentChange ?? 0) >= 0;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-white text-lg">{symbol}</h3>
          {high && low && (
            <p className="text-xs text-gray-500 mt-0.5">H: {high} / L: {low}</p>
          )}
        </div>
        <div className="text-right">
          {currentPrice != null ? (
            <>
              <p className="text-white font-semibold text-lg">₹{currentPrice.toFixed(2)}</p>
              {percentChange != null && (
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {isPositive ? '+' : ''}{percentChange.toFixed(2)}%
                </span>
              )}
            </>
          ) : (
            <span className="text-gray-600 text-sm">N/A</span>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}