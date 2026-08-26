"use client";

import { useState, useEffect, useCallback, useRef } from "react";

import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";
import CandlestickChart, {
  type ChartType,
  type IndicatorsState,
  type CandlestickChartRef,
} from "@/components/CandlestickChart";
import ChartWatchlist from "@/components/ChartWatchlist";
import StockAvatar from "@/components/StockAvatar";
import FadeIn from "@/components/FadeIn";
import { ChangeBadge } from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

import {
  IconCandlestick,
  IconSearch,
  IconBarChart,
  IconActivity,
  IconLineChart,
  IconRotate,
} from "@/lib/icons";
import { formatPrice, displaySymbol } from "@/lib/utils";
import { mergeLiveTick } from "@/lib/liveChart";
import { useToast } from "@/hooks/useToast";
import { useStockSocket } from "@/hooks/useStockSocket";
import api from "@/lib/api";
import type { OhlcPoint } from "@/components/PriceChart";

interface SearchResult {
  symbol: string;
  displaySymbol: string;
  description: string;
}

interface QuoteSummary {
  currentPrice: number;
  change: number;
  percentChange: number;
}

const DEFAULT_SYMBOL = "^NSEI";
const DEFAULT_NAME = "NIFTY 50";

const RANGES = [
  { label: "1D", value: "1d" },
  { label: "5D", value: "5d" },
  { label: "1M", value: "1m" },
  { label: "6M", value: "6m" },
  { label: "1Y", value: "1y" },
  { label: "5Y", value: "5y" },
  { label: "MAX", value: "max" },
];

const CHART_TYPES: { type: ChartType; label: string; icon: React.ReactNode }[] = [
  { type: "candlestick", label: "Candles", icon: <IconCandlestick size={13} /> },
  { type: "line", label: "Line", icon: <IconLineChart size={13} /> },
  { type: "area", label: "Area", icon: <IconActivity size={13} /> },
  { type: "bar", label: "Bar", icon: <IconBarChart size={13} /> },
];

export default function ChartsClient() {
  const { toast, error: toastError } = useToast();
  const chartRef = useRef<CandlestickChartRef>(null);

  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [name, setName] = useState(DEFAULT_NAME);

  const [range, setRange] = useState("1y");
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [indicators, setIndicators] = useState<IndicatorsState>({
    volume: true,
    ma20: false,
    ma50: false,
    ema20: false,
  });

  const [points, setPoints] = useState<OhlcPoint[]>([]);
  const [quote, setQuote] = useState<QuoteSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const loadChart = useCallback(
    async (sym: string, displayName: string, selectedRange = range) => {
      setLoading(true);
      try {
        const [chartRes, quoteRes] = await Promise.all([
          api.get(`/stocks/chart/${encodeURIComponent(sym)}?range=${selectedRange}`),
          api.get(`/stocks/quote/${encodeURIComponent(sym)}`),
        ]);

        setPoints(chartRes.data.data?.points || []);
        setQuote({
          currentPrice: quoteRes.data.data.currentPrice,
          change: quoteRes.data.data.change,
          percentChange: quoteRes.data.data.percentChange,
        });
        setSymbol(sym);
        setName(displayName);
      } catch {
        toastError(`Could not load chart for ${sym}.`);
      } finally {
        setLoading(false);
      }
    },
    [range, toastError],
  );

  useEffect(() => {
    loadChart(DEFAULT_SYMBOL, DEFAULT_NAME, "1y");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRangeChange = (newRange: string) => {
    setRange(newRange);
    loadChart(symbol, name, newRange);
  };

  useStockSocket([symbol], (quote) => {
    if (quote.symbol !== symbol) return;
    setQuote({
      currentPrice: quote.currentPrice,
      change: quote.change,
      percentChange: quote.percentChange,
    });
    if (range === "1d") {
      setPoints((prev) => mergeLiveTick(prev, quote.currentPrice));
    }
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setResults([]);

    try {
      const { data } = await api.get(
        `/stocks/search?q=${encodeURIComponent(query)}`,
      );
      setResults((data.data || []).slice(0, 6));
    } catch {
      toastError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const selectResult = (r: SearchResult) => {
    loadChart(r.symbol, r.description, range);
    setResults([]);
    setQuery("");
  };

  const toggleIndicator = (key: keyof IndicatorsState) => {
    setIndicators((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <FadeIn>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconCandlestick
                  size={22}
                  className="text-emerald-400"
                  aria-hidden="true"
                />
                <h1 className="text-2xl font-bold text-white">Interactive Trading Charts</h1>
              </div>
            </div>

            <form
              onSubmit={handleSearch}
              className="flex gap-2 mb-4"
              role="search"
              aria-label="Search a symbol to chart"
            >
              <div className="flex-1">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search a symbol to chart (e.g. TCS, INFY, RELIANCE)..."
                  leftAddon={<IconSearch size={14} />}
                  aria-label="Search a symbol to chart"
                />
              </div>
              <Button
                type="submit"
                disabled={searching || !query.trim()}
                loading={searching}
                leftIcon={!searching ? <IconSearch size={14} /> : undefined}
              >
                Search
              </Button>
            </form>
          </FadeIn>

          {results.length > 0 && (
            <FadeIn>
              <div className="grid gap-2 sm:grid-cols-2 mb-6">
                {results.map((r) => (
                  <button
                    key={r.symbol}
                    onClick={() => selectResult(r)}
                    className="text-left bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl px-4 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <span className="font-bold text-white text-sm">
                      {r.displaySymbol || r.symbol}
                    </span>
                    <p className="text-xs text-gray-500 truncate">
                      {r.description}
                    </p>
                  </button>
                ))}
              </div>
            </FadeIn>
          )}

          <FadeIn delay={0.05}>
            <div className="flex flex-col lg:flex-row gap-4">
              <ChartWatchlist activeSymbol={symbol} onSelect={(sym, desc) => loadChart(sym, desc, range)} />

              <div className="flex-1 min-w-0 border border-gray-800 rounded-2xl overflow-hidden bg-[#131722] shadow-2xl flex flex-col">
                <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-4 bg-gray-900 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <StockAvatar symbol={symbol} size={40} />
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {displaySymbol(symbol)}
                      </h2>
                      <p className="text-xs text-gray-400">{name}</p>
                    </div>
                  </div>

                  {quote && (
                    <div className="text-right">
                      <p className="text-xl font-bold text-white font-mono">
                        {formatPrice(quote.currentPrice)}
                      </p>
                      <div className="mt-1 flex justify-end">
                        <ChangeBadge value={quote.percentChange} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-2.5 bg-[#181c27] border-b border-[#232733] text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center bg-[#1e222d] p-0.5 rounded-lg border border-gray-800">
                      {RANGES.map((r) => (
                        <button
                          key={r.value}
                          onClick={() => handleRangeChange(r.value)}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                            range === r.value
                              ? "bg-emerald-500 text-black shadow-sm"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center bg-[#1e222d] p-0.5 rounded-lg border border-gray-800">
                      {CHART_TYPES.map((ct) => (
                        <button
                          key={ct.type}
                          onClick={() => setChartType(ct.type)}
                          title={ct.label}
                          className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                            chartType === ct.type
                              ? "bg-gray-700 text-white shadow-sm font-semibold"
                              : "text-gray-400 hover:text-gray-200"
                          }`}
                        >
                          <span>{ct.icon}</span>
                          <span className="hidden sm:inline">{ct.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-[#1e222d] px-2 py-1 rounded-lg border border-gray-800">
                      <span className="text-[11px] text-gray-500 font-medium mr-1 hidden sm:inline">Indicators:</span>
                      <button
                        onClick={() => toggleIndicator("volume")}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                          indicators.volume
                            ? "bg-gray-700 text-emerald-400 font-semibold"
                            : "text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        VOL
                      </button>
                      <button
                        onClick={() => toggleIndicator("ma20")}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                          indicators.ma20
                            ? "bg-[#00E5FF]/20 text-[#00E5FF] font-semibold border border-[#00E5FF]/40"
                            : "text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        MA20
                      </button>
                      <button
                        onClick={() => toggleIndicator("ma50")}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                          indicators.ma50
                            ? "bg-[#FF9100]/20 text-[#FF9100] font-semibold border border-[#FF9100]/40"
                            : "text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        MA50
                      </button>
                      <button
                        onClick={() => toggleIndicator("ema20")}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                          indicators.ema20
                            ? "bg-[#E040FB]/20 text-[#E040FB] font-semibold border border-[#E040FB]/40"
                            : "text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        EMA20
                      </button>
                    </div>

                    <button
                      onClick={() => chartRef.current?.resetZoom()}
                      className="px-2.5 py-1 rounded-lg bg-[#1e222d] border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-xs flex items-center gap-1.5 font-medium"
                      title="Reset Zoom / Fit Content"
                    >
                      <IconRotate size={13} />
                      <span>Reset Zoom</span>
                    </button>
                  </div>
                </div>

                <div className="relative flex-1 bg-[#131722] h-85 sm:h-110 lg:h-130">
                  {loading ? (
                    <div className="h-full flex items-center justify-center">
                      <Spinner size="lg" label={`Loading ${range.toUpperCase()} chart data…`} />
                    </div>
                  ) : points.length > 1 ? (
                    <CandlestickChart
                      ref={chartRef}
                      points={points}
                      symbol={symbol}
                      chartType={chartType}
                      indicators={indicators}
                      range={range}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center px-4 text-center text-sm text-gray-500">
                      No chart data available for {symbol} ({range.toUpperCase()}).
                    </div>
                  )}
                </div>
              </div>
            </div>
          </FadeIn>
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </ProtectedRoute>
  );
}
