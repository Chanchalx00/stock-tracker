"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";
import FadeIn from "@/components/FadeIn";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import StockAvatar from "@/components/StockAvatar";

import {
  IconSparkles,
  IconBrain,
  IconFlame,
  IconTrendingUp,
  IconTrendingDown,
  IconShield,
  IconTarget,
  IconSearch,
  IconCheck,
  IconInfo,
  IconRefresh,
  IconAward,
  IconActivity,
  IconChevronDown,
  IconChevronUp,
  IconClose,
  IconError,
  IconWarning,
  IconCalendar,
  IconExternalLink,
  IconBarChart,
} from "@/lib/icons";

import { useToast } from "@/hooks/useToast";
import api from "@/lib/api";

export type Verdict = "Pass" | "Caution" | "Fail" | "Not Assessed" | "Info";

export interface IpoParameter {
  id: number;
  name: string;
  category: string;
  benchmark: string;
  actual: string;
  verdict: Verdict;
  weight: number;
  whyItMatters: string;
  interpretation: string;
  source: string;
  dataQuality: string;
}

export interface IpoItem {
  id: string;
  name: string;
  symbol: string;
  logoUrl?: string;
  category: "MAINBOARD" | "SME";
  status: "OPEN" | "UPCOMING" | "CLOSED";
  allotmentStatusUrl?: string;
  issuePrice: number;
  lotSize?: number;
  issueSize: string;
  openDate?: string;
  closeDate?: string;
  listingDate?: string;
  allotmentDate?: string;
  reservation?: {
    qib?: number;
    nii?: number;
    retail?: number;
  };
  brokerRecommendation?: {
    subscribe: number;
    mayApply: number;
    neutral: number;
    avoid: number;
  };
  sector?: string;
  sourceUrl?: string;
  issueSplit?: {
    totalCr?: number;
    freshCr?: number;
    ofsCr?: number;
    freshPct?: number;
    ofsPct?: number;
    structureLabel?: string;
    promoterOfsAmountCr?: number;
    promoterSellerNames?: string[];
  };
  subscription?: { total?: number; qib?: number; nii?: number; retail?: number };
  aiScore: number;
  rating: "STRONG APPLY" | "APPLY FOR LISTING GAIN" | "APPLY LONG TERM" | "APPLY WITH CAUTION" | "AVOID";
  rawRating?: string;
  confidence?: "High" | "Medium" | "Low";
  coveragePct?: number;
  verdictCounts?: { pass: number; caution: number; fail: number; notAssessed: number; info: number };
  aiVerdict: string;
  parameters: IpoParameter[];
  parameters20?: IpoParameter[];
  passedCount: number;
  parameterCount?: number;
  swot: {
    strengths: string[];
    risks: string[];
  };
}

export interface StockAnalysis {
  symbol: string;
  name?: string;
  currentPrice: number;
  percentChange: number;
  momentumScore: number;
  momentumGrade: string;
  trendSignal: string;
  confidence: "High" | "Medium" | "Low";
  technicalIndicators: {
    rsi14: number | null;
    rsiZone: string | null;
    rsiReliability: "normal" | "limited" | null;
    macd: {
      macd: number | null;
      signal: number | null;
      histogram: number | null;
      position: "ABOVE_SIGNAL" | "BELOW_SIGNAL";
      crossover: "BULLISH" | "BEARISH" | null;
      barsSinceCrossover: number | null;
    } | null;
    sma20: number | null;
    sma50: number | null;
    sma200: number | null;
    ema20: number | null;
    atr14: number | null;
    atrPct: number | null;
    bollinger: { middle: number | null; upper: number | null; lower: number | null; bandwidthPct: number | null } | null;
    relativeVolume: number | null;
    avgVolume20: number | null;
    latestVolume: number | null;
  };
  levels: {
    support1: number | null;
    support1Touches: number | null;
    support2: number | null;
    resistance1: number | null;
    resistance1Touches: number | null;
    resistance2: number | null;
    high52: number | null;
    low52: number | null;
    pctFrom52High: number | null;
    pctFrom52Low: number | null;
    atrStopReference: number | null;
    atrStopBasis: string | null;
  };
  signals: { name: string; direction: "BULLISH" | "BEARISH" | "NEUTRAL"; weight: number; detail: string }[];
  insights: string[];
  dataQuality: {
    candles: number;
    rangeRequested: string;
    firstCandle: number | null;
    lastCandle: number | null;
    unavailable: string[];
    note: string;
  };
  methodology: {
    summary: string;
    indicators: { name: string; how: string; read: string }[];
    limitations: string[];
  };
}

export interface TrackRecordItem {
  id?: string;
  name: string;
  logoUrl?: string;
  category: "MAINBOARD" | "SME";
  sourceUrl?: string;
  listingGainPct?: number;
  currentGainPct?: number;
  aiAvailable: boolean;
  aiScore?: number;
  passedCount?: number;
  parameterCount?: number;
  confidence?: "High" | "Medium" | "Low";
  sector?: string;
  rating?: string;
  comparison?: "Correct Call" | "Missed Opportunity" | "Overestimated" | "Hedged Call" | "Not enough data";
}

export default function AiAnalysisClient() {
  const { toast, success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<"ipo" | "stock" | "track">("ipo");
  const [ipos, setIpos] = useState<IpoItem[]>([]);
  const [summary, setSummary] = useState<{
    activeIposCount: number;
    avgBrokerSubscribeRatio?: number;
    topPick: string;
    marketSentiment: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "MAINBOARD" | "SME">("ALL");

  const [trackRecords, setTrackRecords] = useState<TrackRecordItem[]>([]);
  const [trackSummary, setTrackSummary] = useState<{
    totalTracked: number;
    aiEvaluated: number;
    directionalCalls?: number;
    hedgedCalls?: number;
    accuracyPct?: number;
    accuracyBasis?: string;
  } | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackLoaded, setTrackLoaded] = useState(false);

  const [expandedIpoId, setExpandedIpoId] = useState<string | null>(null);
  const [selectedModalIpo, setSelectedModalIpo] = useState<IpoItem | null>(null);

  const [searchSymbol, setSearchSymbol] = useState("");
  const [stockAnalysis, setStockAnalysis] = useState<StockAnalysis | null>(null);
  const [searchingStock, setSearchingStock] = useState(false);

  const loadIpoAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/analysis/ipo");
      setIpos(data.data?.ipos || []);
      setSummary(data.data?.summary || null);
    } catch {
      toastError("Could not fetch AI Momentum Mantra IPO data.");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadIpoAnalysis();
  }, [loadIpoAnalysis]);

  const loadTrackRecord = useCallback(async () => {
    setTrackLoading(true);
    try {
      const { data } = await api.get("/analysis/ipo/track-record");
      setTrackRecords(data.data?.ipos || []);
      setTrackSummary(data.data?.summary || null);
    } catch {
      toastError("Could not fetch the listed IPO track record.");
    } finally {
      setTrackLoading(false);
      setTrackLoaded(true);
    }
  }, [toastError]);

  useEffect(() => {
    if (activeTab === "track" && !trackLoaded && !trackLoading) {
      loadTrackRecord();
    }
  }, [activeTab, trackLoaded, trackLoading, loadTrackRecord]);

  const handleSearchStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchSymbol.trim();
    if (!query) return;

    if (activeTab === "ipo") {
      return;
    }

    setSearchingStock(true);
    try {
      const { data } = await api.get(`/analysis/stock/${encodeURIComponent(query.toUpperCase())}`);
      setStockAnalysis(data.data || null);
    } catch {
      setStockAnalysis(null);
      toastError(`Could not find live market data for "${query}".`);
    } finally {
      setSearchingStock(false);
    }
  };

  const getRatingBadgeClass = (rating: string) => {
    switch (rating) {
      case "STRONG APPLY":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
      case "APPLY FOR LISTING GAIN":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/40";
      case "APPLY LONG TERM":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "APPLY WITH CAUTION":
        return "bg-orange-500/20 text-orange-300 border-orange-500/40";
      default:
        return "bg-red-500/20 text-red-400 border-red-500/40";
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
        <Navbar />

        <main className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
          <FadeIn>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-950/40 shrink-0">
                  <IconBrain size={24} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                       IPO & Equity AI Analysis
                    </h1>
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <IconSparkles size={12} className="animate-pulse" />
                      AI ENGINE ACTIVE
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Weighted multi-parameter IPO evaluations built only from data published on Chittorgarh — no grey-market premium, and nothing scored as a pass just because the source is silent
                  </p>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                leftIcon={<IconRefresh size={14} />}
                onClick={loadIpoAnalysis}
                loading={loading}
                className="w-full sm:w-auto justify-center"
              >
                Refresh Engine
              </Button>
            </div>

            {summary && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                    <IconFlame size={20} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider block">
                      Top AI Momentum Pick
                    </span>
                    <span className="text-sm font-bold text-white break-words">
                      {summary.topPick}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                    <IconTrendingUp size={20} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider block">
                      Avg. Broker Subscribe Consensus
                    </span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {summary.avgBrokerSubscribeRatio !== undefined
                        ? `${summary.avgBrokerSubscribeRatio}% Subscribe`
                        : "No broker reviews yet"}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
                    <IconAward size={20} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider block">
                      Market Sentiment
                    </span>
                    <span className="text-sm font-bold text-purple-300 font-mono">
                      {summary.marketSentiment} ({summary.activeIposCount} Active IPOs)
                    </span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSearchStock} className="mb-6 flex flex-col sm:flex-row gap-2">
              <div className="flex-1 min-w-0">
                <Input
                  value={searchSymbol}
                  onChange={(e) => setSearchSymbol(e.target.value)}
                  placeholder="Analyze any stock symbol (e.g. RELIANCE, TCS, INFY)..."
                  leftAddon={<IconSearch size={14} />}
                />
              </div>
              <Button
                type="submit"
                loading={searchingStock}
                leftIcon={<IconSparkles size={14} />}
                className="w-full sm:w-auto justify-center shrink-0"
              >
                Analyze
              </Button>
            </form>

            {/* Tabs: horizontally scrollable on mobile so labels never overflow the viewport */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-gray-800 mb-6 pb-2">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
                <button
                  onClick={() => setActiveTab("ipo")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                    activeTab === "ipo"
                      ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                      : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  <IconFlame size={14} />
                  <span>Momentum Mantra IPOs ({ipos.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("stock")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                    activeTab === "stock"
                      ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                      : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  <IconActivity size={14} />
                  <span>Equity Momentum Screener</span>
                </button>

                <button
                  onClick={() => setActiveTab("track")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                    activeTab === "track"
                      ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                      : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  <IconBarChart size={14} />
                  <span>IPO Track Record</span>
                </button>
              </div>

              {activeTab === "ipo" && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 sm:ml-auto">
                  {(["ALL", "MAINBOARD", "SME"] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-colors border shrink-0 whitespace-nowrap ${
                        categoryFilter === cat
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                          : "bg-gray-900 border-gray-800 text-gray-500 hover:text-white"
                      }`}
                    >
                      {cat === "ALL" ? "All" : cat === "MAINBOARD" ? "Mainboard" : "SME"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </FadeIn>

          {activeTab === "ipo" && (
            <FadeIn delay={0.05}>
              {loading ? (
                <div className="flex justify-center py-16">
                  <Spinner size="lg" label="Running Momentum Mantra AI engine…" />
                </div>
              ) : (
                <div className="space-y-4">
                  {ipos
                    .filter((ipo) => categoryFilter === "ALL" || ipo.category === categoryFilter)
                    .filter((ipo) => {
                      if (!searchSymbol.trim()) return true;
                      const q = searchSymbol.toLowerCase().trim();
                      return ipo.name.toLowerCase().includes(q) || ipo.symbol.toLowerCase().includes(q);
                    })
                    .map((ipo) => {
                    const isExpanded = expandedIpoId === ipo.id;
                    const ratingClass = getRatingBadgeClass(ipo.rating);

                    return (
                      <div
                        key={ipo.id}
                        className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-4 sm:p-5 transition-all shadow-xl"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <StockAvatar symbol={ipo.symbol} logoUrl={ipo.logoUrl} size={42} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base sm:text-lg font-bold text-white break-words">
                                  {ipo.name}
                                </h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-400 border border-gray-700 shrink-0">
                                  {ipo.category}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                                    ipo.status === "OPEN"
                                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                      : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                                  }`}
                                >
                                  {ipo.status}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">
                                Issue Size: {ipo.issueSize}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                            <Button
                              variant="secondary"
                              size="sm"
                              leftIcon={<IconCheck size={14} className="text-emerald-400" />}
                              onClick={() => setSelectedModalIpo(ipo)}
                            >
                              Check {ipo.parameterCount ?? (ipo.parameters?.length || 0)} Parameters ({ipo.passedCount}/{(ipo.parameters || []).filter((p) => p.verdict !== "Not Assessed" && p.verdict !== "Info").length})
                            </Button>

                            <Link
                              href={`/ai-analysis/${encodeURIComponent(ipo.symbol)}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
                            >
                              <IconBrain size={14} />
                              <span>Deep Analysis Report</span>
                            </Link>

                            {ipo.allotmentStatusUrl && (
                              <a
                                href={ipo.allotmentStatusUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white font-bold text-xs transition-all"
                              >
                                <IconCalendar size={14} />
                                <span>Check Allotment Status</span>
                                <IconExternalLink size={11} className="text-gray-500" />
                              </a>
                            )}

                            <div className="flex items-center gap-2 bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-xl">
                              <div className="relative w-9 h-9 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center font-bold text-emerald-400 font-mono text-xs shrink-0">
                                {ipo.aiScore}
                              </div>
                              <div>
                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">
                                  AI Score
                                </span>
                                <span className="text-xs font-bold text-white font-mono">
                                  {ipo.aiScore}/100
                                </span>
                              </div>
                            </div>

                            <span className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase border ${ratingClass}`}>
                              {ipo.rating}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-950 border border-gray-800/80 rounded-xl p-3.5 mb-4 text-xs">
                          <div>
                            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">
                              Issue Price
                            </span>
                            <span className="text-sm font-bold text-white font-mono">
                              ₹{ipo.issuePrice}
                            </span>
                            {ipo.lotSize && (
                              <span className="text-[10px] text-gray-400 block mt-0.5">
                                Lot: {ipo.lotSize} shares (₹{(ipo.issuePrice * ipo.lotSize).toLocaleString()})
                              </span>
                            )}
                          </div>

                          <div>
                            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">
                              Broker Consensus
                            </span>
                            {ipo.brokerRecommendation ? (
                              <>
                                <span className="text-sm font-bold text-emerald-400 font-mono">
                                  {ipo.brokerRecommendation.subscribe}/
                                  {ipo.brokerRecommendation.subscribe +
                                    ipo.brokerRecommendation.mayApply +
                                    ipo.brokerRecommendation.neutral +
                                    ipo.brokerRecommendation.avoid}{" "}
                                  Subscribe
                                </span>
                                <span className="text-[10px] text-gray-400 block mt-0.5">
                                  May Apply: {ipo.brokerRecommendation.mayApply} · Avoid: {ipo.brokerRecommendation.avoid}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm font-bold text-gray-500 font-mono">No reviews yet</span>
                            )}
                          </div>

                          <div>
                            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">
                              Category Reservation
                            </span>
                            <span className="text-sm font-bold text-white font-mono">
                              {ipo.reservation?.retail !== undefined ? `${ipo.reservation.retail}% Retail` : "—"}
                            </span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              QIB: {ipo.reservation?.qib ?? "—"}% · NII: {ipo.reservation?.nii ?? "—"}%
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">
                              AI Rating
                            </span>
                            <span className="text-sm font-bold text-cyan-400 font-mono">
                              {ipo.passedCount}/{(ipo.parameters || []).filter((p) => p.verdict !== "Not Assessed" && p.verdict !== "Info").length} Passed
                            </span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              {ipo.rating}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gray-950/80 border border-gray-800/80 rounded-xl px-3.5 py-2 mb-3 text-[11px]">
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <IconCalendar size={13} className="text-emerald-400" />
                            <span className="font-semibold text-gray-300">IPO Schedule:</span>
                          </div>
                          <div className="flex items-center gap-3 text-gray-400 flex-wrap font-mono">
                            <span>Open: <strong className="text-emerald-400">{ipo.openDate || "Not announced"}</strong></span>
                            <span className="hidden sm:inline">•</span>
                            <span>Close: <strong className="text-amber-400">{ipo.closeDate || "Not announced"}</strong></span>
                            <span className="hidden sm:inline">•</span>
                            <span>Allotment: <strong className="text-purple-400">{ipo.allotmentDate || "Not announced"}</strong></span>
                            <span className="hidden sm:inline">•</span>
                            <span>Listing: <strong className="text-cyan-400">{ipo.listingDate || "Not announced"}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-xs text-gray-300 mb-3">
                          <IconInfo size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                          <p className="leading-relaxed font-medium">
                            <span className="font-bold text-white">AI Verdict:</span> {ipo.aiVerdict}
                          </p>
                        </div>

                        <button
                          onClick={() => setExpandedIpoId(isExpanded ? null : ipo.id)}
                          className="w-full flex items-center justify-between text-xs font-semibold text-gray-400 hover:text-white pt-2 border-t border-gray-800 transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <IconTarget size={14} className="text-amber-400" />
                            <span>View Full SWOT Analysis & Catalysts</span>
                          </span>
                          {isExpanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                        </button>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3">
                              <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] flex items-center gap-1 mb-2">
                                <IconCheck size={12} />
                                Key Business Drivers & Strengths
                              </span>
                              <ul className="space-y-1.5 text-gray-300">
                                {ipo.swot.strengths.map((s, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-emerald-400 font-bold">•</span>
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-3">
                              <span className="font-bold text-red-400 uppercase tracking-wider text-[10px] flex items-center gap-1 mb-2">
                                <IconShield size={12} />
                                Key Risk Factors & Concerns
                              </span>
                              <ul className="space-y-1.5 text-gray-300">
                                {ipo.swot.risks.map((r, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-red-400 font-bold">•</span>
                                    <span>{r}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </FadeIn>
          )}

          {activeTab === "stock" && (
            <FadeIn delay={0.05}>
              {stockAnalysis ? (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <StockAvatar symbol={stockAnalysis.symbol} size={44} />
                      <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-white break-words">
                          {stockAnalysis.name || stockAnalysis.symbol}
                        </h2>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                            {stockAnalysis.trendSignal}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {stockAnalysis.dataQuality.candles} daily candles · {stockAnalysis.confidence} confidence
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="text-left sm:text-right">
                        <p className="text-2xl font-bold text-white font-mono">
                          ₹{stockAnalysis.currentPrice.toFixed(2)}
                        </p>
                        <span
                          className={`text-xs font-bold font-mono ${
                            stockAnalysis.percentChange >= 0 ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {stockAnalysis.percentChange >= 0 ? "+" : ""}
                          {stockAnalysis.percentChange.toFixed(2)}%
                        </span>
                      </div>

                      <div className="px-4 py-2 rounded-xl bg-gray-950 border border-gray-800 text-center shrink-0">
                        <span className="text-[10px] text-gray-500 font-bold uppercase block">
                          Momentum Score
                        </span>
                        <span
                          className={`text-lg font-bold font-mono ${
                            stockAnalysis.momentumScore >= 60
                              ? "text-emerald-400"
                              : stockAnalysis.momentumScore <= 40
                                ? "text-red-400"
                                : "text-amber-400"
                          }`}
                        >
                          {stockAnalysis.momentumScore}/100
                        </span>
                        <span className="text-[9px] text-gray-500 block font-bold">
                          {stockAnalysis.momentumGrade}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                    {(
                      [
                        [
                          "RSI (14)",
                          stockAnalysis.technicalIndicators.rsi14 !== null
                            ? String(stockAnalysis.technicalIndicators.rsi14)
                            : null,
                          stockAnalysis.technicalIndicators.rsiZone,
                        ],
                        [
                          "MACD",
                          stockAnalysis.technicalIndicators.macd
                            ? String(stockAnalysis.technicalIndicators.macd.macd)
                            : null,
                          stockAnalysis.technicalIndicators.macd
                            ? stockAnalysis.technicalIndicators.macd.position === "ABOVE_SIGNAL"
                              ? "Above signal"
                              : "Below signal"
                            : null,
                        ],
                        [
                          "SMA 50",
                          stockAnalysis.technicalIndicators.sma50 !== null
                            ? `₹${stockAnalysis.technicalIndicators.sma50}`
                            : null,
                          null,
                        ],
                        [
                          "SMA 200",
                          stockAnalysis.technicalIndicators.sma200 !== null
                            ? `₹${stockAnalysis.technicalIndicators.sma200}`
                            : null,
                          null,
                        ],
                        [
                          "ATR (14)",
                          stockAnalysis.technicalIndicators.atr14 !== null
                            ? `₹${stockAnalysis.technicalIndicators.atr14}`
                            : null,
                          stockAnalysis.technicalIndicators.atrPct !== null
                            ? `${stockAnalysis.technicalIndicators.atrPct}% of price`
                            : null,
                        ],
                        [
                          "Rel. Volume",
                          stockAnalysis.technicalIndicators.relativeVolume !== null
                            ? `${stockAnalysis.technicalIndicators.relativeVolume}x`
                            : null,
                          "vs 20-day avg",
                        ],
                      ] as const
                    ).map(([label, value, sub]) => (
                      <div key={label} className="bg-gray-950 p-3 sm:p-3.5 rounded-xl border border-gray-800">
                        <span className="text-gray-500 font-semibold uppercase block text-[10px]">{label}</span>
                        <span
                          className={`text-sm font-bold font-mono ${value === null ? "text-gray-600" : "text-white"}`}
                        >
                          {value ?? "—"}
                        </span>
                        {sub && value !== null && (
                          <span className="text-[9px] text-gray-500 block">{sub}</span>
                        )}
                        {value === null && (
                          <span className="text-[9px] text-gray-600 block">not enough history</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 space-y-2.5">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        Swing Levels
                      </h4>
                      <div className="space-y-1.5 text-xs font-mono">
                        {(
                          [
                            ["Resistance 2", stockAnalysis.levels.resistance2, null, "text-red-300"],
                            [
                              "Resistance 1",
                              stockAnalysis.levels.resistance1,
                              stockAnalysis.levels.resistance1Touches,
                              "text-red-400",
                            ],
                            ["Current", stockAnalysis.currentPrice, null, "text-white"],
                            [
                              "Support 1",
                              stockAnalysis.levels.support1,
                              stockAnalysis.levels.support1Touches,
                              "text-emerald-400",
                            ],
                            ["Support 2", stockAnalysis.levels.support2, null, "text-emerald-300"],
                          ] as const
                        ).map(([label, value, touches, color]) => (
                          <div key={label} className="flex items-center justify-between gap-2">
                            <span className="text-gray-500">
                              {label}
                              {touches ? (
                                <span className="text-gray-600 text-[10px]">
                                  {" "}
                                  ({touches} touch{touches === 1 ? "" : "es"})
                                </span>
                              ) : null}
                            </span>
                            <span className={value === null ? "text-gray-600" : color}>
                              {value !== null ? `₹${Number(value).toFixed(2)}` : "none found"}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed pt-1 border-t border-gray-800">
                        Levels are swing pivots from the actual price history, clustered when they sit within about
                        1% of each other. Where no pivot exists on a side, it says so instead of showing a nudged
                        version of today&apos;s range.
                      </p>
                    </div>

                    <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 space-y-2.5">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        52-Week Range &amp; Volatility
                      </h4>
                      <div className="space-y-1.5 text-xs font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">52-week high</span>
                          <span className="text-white">
                            {stockAnalysis.levels.high52 !== null ? `₹${stockAnalysis.levels.high52}` : "—"}
                            {stockAnalysis.levels.pctFrom52High !== null && (
                              <span className="text-gray-500 text-[10px]">
                                {" "}
                                ({stockAnalysis.levels.pctFrom52High}%)
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">52-week low</span>
                          <span className="text-white">
                            {stockAnalysis.levels.low52 !== null ? `₹${stockAnalysis.levels.low52}` : "—"}
                            {stockAnalysis.levels.pctFrom52Low !== null && (
                              <span className="text-gray-500 text-[10px]">
                                {" "}
                                (+{stockAnalysis.levels.pctFrom52Low}%)
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Volatility reference</span>
                          <span className="text-amber-400">
                            {stockAnalysis.levels.atrStopReference !== null
                              ? `₹${stockAnalysis.levels.atrStopReference}`
                              : "—"}
                          </span>
                        </div>
                      </div>
                      {stockAnalysis.levels.atrStopBasis && (
                        <p className="text-[10px] text-gray-500 leading-relaxed pt-1 border-t border-gray-800">
                          {stockAnalysis.levels.atrStopBasis}. This is a measurement of how far the stock typically
                          travels, not a recommended stop or a prediction. No price target is published — the data
                          here cannot support one.
                        </p>
                      )}
                    </div>
                  </div>

                  {stockAnalysis.signals.length > 0 && (
                    <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 space-y-2.5">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <IconTarget size={14} />
                        <span>Signal Breakdown</span>
                      </h4>
                      <div className="space-y-2">
                        {stockAnalysis.signals.map((s) => (
                          <div key={s.name} className="flex items-start gap-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border shrink-0 mt-0.5 ${
                                s.direction === "BULLISH"
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                  : s.direction === "BEARISH"
                                    ? "bg-red-500/20 text-red-400 border-red-500/40"
                                    : "bg-gray-700/40 text-gray-300 border-gray-600/50"
                              }`}
                            >
                              {s.direction}
                            </span>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white">
                                {s.name}
                                <span className="text-gray-600 font-normal"> · weight {s.weight}</span>
                              </span>
                              <p className="text-[11px] text-gray-400 leading-relaxed">{s.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <IconSparkles size={14} />
                      <span>What the data says</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-gray-300">
                      {stockAnalysis.insights.map((ins, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{ins}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {stockAnalysis.dataQuality.unavailable.length > 0 && (
                    <div className="bg-gray-800/30 border border-gray-700/60 rounded-xl p-4 space-y-2">
                      <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                        <IconInfo size={14} />
                        <span>Not available for this stock</span>
                      </h4>
                      <ul className="space-y-1">
                        {stockAnalysis.dataQuality.unavailable.map((u, idx) => (
                          <li key={idx} className="text-[11px] text-gray-400 flex items-start gap-2">
                            <span className="text-gray-600 shrink-0">•</span>
                            <span>{u}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        {stockAnalysis.dataQuality.note}
                      </p>
                    </div>
                  )}

                  <details className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden group">
                    <summary className="px-4 py-3 cursor-pointer text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between hover:bg-gray-900/60 transition-colors">
                      <span className="flex items-center gap-1.5">
                        <IconInfo size={14} />
                        How these numbers are calculated
                      </span>
                      <IconChevronDown size={14} className="text-gray-500 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-800 pt-3">
                      <p className="text-[11px] text-gray-300 leading-relaxed">
                        {stockAnalysis.methodology.summary}
                      </p>
                      <div className="space-y-2.5">
                        {stockAnalysis.methodology.indicators.map((ind) => (
                          <div key={ind.name} className="space-y-0.5">
                            <span className="text-[11px] font-bold text-white">{ind.name}</span>
                            <p className="text-[10px] text-gray-500 leading-relaxed">{ind.how}</p>
                            <p className="text-[10px] text-gray-400 leading-relaxed">{ind.read}</p>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t border-gray-800 space-y-1.5">
                        <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">
                          Limitations
                        </span>
                        {stockAnalysis.methodology.limitations.map((l, i) => (
                          <p key={i} className="text-[10px] text-gray-400 leading-relaxed flex items-start gap-1.5">
                            <span className="text-amber-500/70 shrink-0">•</span>
                            <span>{l}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  </details>
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 sm:p-12 text-center">
                  <IconSearch size={32} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-sm text-gray-400 font-medium">
                    Search any stock symbol above (e.g. RELIANCE, TCS, INFY) to generate a custom Momentum Mantra report.
                  </p>
                </div>
              )}
            </FadeIn>
          )}

          {activeTab === "track" && (
            <FadeIn delay={0.05}>
              {trackLoading ? (
                <div className="flex justify-center py-16">
                  <Spinner size="lg" label="Scoring recently listed IPOs against real Chittorgarh outcomes…" />
                </div>
              ) : (
                <div className="space-y-4">
                  {trackSummary && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                          <IconBarChart size={20} />
                        </div>
                        <div>
                          <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider block">
                            Listed IPOs Tracked
                          </span>
                          <span className="text-sm font-bold text-white">{trackSummary.totalTracked}</span>
                        </div>
                      </div>

                      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
                          <IconBrain size={20} />
                        </div>
                        <div>
                          <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider block">
                            AI-Scored
                          </span>
                          <span className="text-sm font-bold text-white">{trackSummary.aiEvaluated}</span>
                        </div>
                      </div>

                      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                          <IconTarget size={20} />
                        </div>
                        <div>
                          <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider block">
                            AI Call Accuracy
                          </span>
                          <span className="text-sm font-bold text-emerald-400 font-mono">
                            {trackSummary.accuracyPct !== undefined ? `${trackSummary.accuracyPct}%` : "N/A"}
                          </span>
                          {trackSummary.directionalCalls !== undefined && (
                            <span className="text-[10px] text-gray-500 block">
                              of {trackSummary.directionalCalls} directional calls
                              {trackSummary.hedgedCalls ? ` · ${trackSummary.hedgedCalls} hedged, excluded` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-gray-500 leading-relaxed px-1">
                    Real listing-day and current gain/loss %, sourced from Chittorgarh&apos;s own IPO performance
                    tracker, compared against what the weighted parameter framework scores today using each
                    company&apos;s real fundamentals. &quot;Correct Call&quot; means the recommendation direction (Apply
                    vs Avoid) matched the actual outcome (gain vs loss).{" "}
                    {trackSummary?.accuracyBasis ||
                      "Hedged “Apply with Caution” ratings are excluded from the accuracy denominator, because a hedged rating makes no directional claim."}{" "}
                    This is a backward-looking scorecard of the framework, not evidence that it will call the next issue
                    correctly.
                  </p>

                  {trackRecords.length === 0 ? (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 sm:p-12 text-center">
                      <IconBarChart size={32} className="mx-auto text-gray-600 mb-3" />
                      <p className="text-sm text-gray-400 font-medium">No listed IPO track record available right now.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-gray-800 -mx-3 px-3 sm:mx-0 sm:px-0">
                      <table className="w-full min-w-[720px] text-xs">
                        <thead className="bg-gray-900 border-b border-gray-800 text-gray-400 uppercase font-bold">
                          <tr>
                            <th scope="col" className="text-left px-4 py-3 whitespace-nowrap">Company</th>
                            <th scope="col" className="text-left px-4 py-3 whitespace-nowrap">Category</th>
                            <th scope="col" className="text-right px-4 py-3 whitespace-nowrap">Listing Day Gain</th>
                            <th scope="col" className="text-right px-4 py-3 whitespace-nowrap">Current Gain</th>
                            <th scope="col" className="text-right px-4 py-3 whitespace-nowrap">AI Score / Rating</th>
                            <th scope="col" className="text-center px-4 py-3 whitespace-nowrap">AI vs Real</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/80 text-gray-200 font-medium bg-gray-900/60">
                          {trackRecords.map((r, idx) => {
                            const gainClass = (v?: number) =>
                              v === undefined ? "text-gray-500" : v >= 0 ? "text-emerald-400" : "text-red-400";
                            const comparisonClass =
                              r.comparison === "Correct Call"
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                : r.comparison === "Hedged Call"
                                ? "bg-gray-700/40 text-gray-300 border-gray-600/50"
                                : r.comparison === "Missed Opportunity"
                                ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                                : r.comparison === "Overestimated"
                                ? "bg-red-500/20 text-red-400 border-red-500/40"
                                : "bg-gray-800 text-gray-500 border-gray-700";
                            return (
                              <tr key={r.id || `${r.name}-${idx}`} className="hover:bg-gray-950/60 transition-colors">
                                <td className="px-4 py-3 font-bold text-white whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <StockAvatar symbol={r.id || r.name} logoUrl={r.logoUrl} size={24} />
                                    {r.sourceUrl ? (
                                      <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
                                        {r.name}
                                      </a>
                                    ) : (
                                      <span>{r.name}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{r.category}</td>
                                <td className={`px-4 py-3 text-right font-mono whitespace-nowrap ${gainClass(r.listingGainPct)}`}>
                                  {r.listingGainPct !== undefined ? `${r.listingGainPct >= 0 ? "+" : ""}${r.listingGainPct}%` : "—"}
                                </td>
                                <td className={`px-4 py-3 text-right font-mono font-bold whitespace-nowrap ${gainClass(r.currentGainPct)}`}>
                                  {r.currentGainPct !== undefined ? `${r.currentGainPct >= 0 ? "+" : ""}${r.currentGainPct}%` : "—"}
                                </td>
                                <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                                  {r.aiAvailable ? (
                                    <>
                                      <span className="text-white font-bold">{r.aiScore}/100</span>
                                      <span className="block text-[10px] text-gray-500">{r.rating}</span>
                                    </>
                                  ) : (
                                    <span className="text-gray-500">N/A</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${comparisonClass}`}>
                                    {r.comparison || "N/A"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </FadeIn>
          )}

          {selectedModalIpo && (
            <IpoParametersModal
              ipo={selectedModalIpo}
              onClose={() => setSelectedModalIpo(null)}
            />
          )}
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </ProtectedRoute>
  );
}

const MODAL_VERDICT_TONE: Record<Verdict, { card: string; pill: string; icon: string }> = {
  Pass: {
    card: "bg-emerald-500/10 border-emerald-500/30",
    pill: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    icon: "bg-emerald-500/20 text-emerald-400",
  },
  Caution: {
    card: "bg-amber-500/10 border-amber-500/30",
    pill: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    icon: "bg-amber-500/20 text-amber-400",
  },
  Fail: {
    card: "bg-red-500/10 border-red-500/30",
    pill: "bg-red-500/20 text-red-400 border border-red-500/30",
    icon: "bg-red-500/20 text-red-400",
  },
  "Not Assessed": {
    card: "bg-gray-700/20 border-gray-600/40",
    pill: "bg-gray-700/40 text-gray-300 border border-gray-600/50",
    icon: "bg-gray-700/40 text-gray-300",
  },
  Info: {
    card: "bg-blue-500/10 border-blue-500/30",
    pill: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
    icon: "bg-blue-500/20 text-blue-300",
  },
};

function IpoParametersModal({
  ipo,
  onClose,
}: {
  ipo: IpoItem;
  onClose: () => void;
}) {
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const params = ipo.parameters || ipo.parameters20 || [];
  const categories = ["ALL", ...Array.from(new Set(params.map((p) => p.category)))];
  const filteredParams = filterCategory === "ALL" ? params : params.filter((p) => p.category === filterCategory);

  const scored = params.filter((p) => p.verdict === "Pass" || p.verdict === "Caution" || p.verdict === "Fail");
  const passedCount = params.filter((p) => p.verdict === "Pass").length;
  const notAssessedCount = params.filter((p) => p.verdict === "Not Assessed").length;
  const passPercent = scored.length > 0 ? (passedCount / scored.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className="bg-gray-950 border border-gray-800 sm:rounded-3xl w-full h-full sm:h-auto max-w-4xl max-h-full sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-800 bg-gray-900/90 flex items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <StockAvatar symbol={ipo.symbol} size={40} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-bold text-white tracking-tight break-words">
                  {ipo.name} ({ipo.symbol})
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                  {passedCount} / {scored.length} PASSED
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {params.length}-parameter diagnostic, sourced live from Chittorgarh
                {notAssessedCount > 0 && ` · ${notAssessedCount} not assessable from source`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <IconClose size={20} />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
          <div className="flex justify-between items-center text-xs font-bold text-gray-400 mb-1.5 gap-2">
            <span className="min-w-0 truncate">
              Weighted AI score {ipo.aiScore}/100 · {ipo.rating}
              {ipo.confidence && ` · ${ipo.confidence} confidence`}
            </span>
            <span className="text-emerald-400 font-mono shrink-0">{passPercent.toFixed(0)}% passed</span>
          </div>
          <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-300 transition-all duration-500"
              style={{ width: `${passPercent}%` }}
            />
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3 border-b border-gray-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 bg-gray-950">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border shrink-0 ${
                filterCategory === cat
                  ? "bg-emerald-500 text-black border-emerald-500 font-bold"
                  : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {filteredParams.map((param) => {
            const tone = MODAL_VERDICT_TONE[param.verdict] ?? MODAL_VERDICT_TONE.Caution;

            return (
              <div key={param.id} className={`rounded-2xl p-3 sm:p-4 border transition-all ${tone.card}`}>
                <div className="flex items-start sm:items-center justify-between flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className={`p-1 rounded-full shrink-0 ${tone.icon}`}>
                      {param.verdict === "Pass" ? (
                        <IconCheck size={15} />
                      ) : param.verdict === "Fail" ? (
                        <IconError size={15} />
                      ) : param.verdict === "Not Assessed" || param.verdict === "Info" ? (
                        <IconInfo size={15} />
                      ) : (
                        <IconWarning size={15} />
                      )}
                    </div>
                    <span className="font-bold text-white text-sm">
                      #{param.id} {param.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-800 text-gray-400 border border-gray-700">
                      {param.category}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${tone.pill}`}>
                      {param.verdict}
                    </span>
                    {param.weight > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-800 text-gray-500 border border-gray-700">
                        weight {param.weight}
                      </span>
                    )}
                  </div>

                  <div className="w-full sm:w-auto text-left sm:text-right sm:shrink-0">
                    <span className="text-[11px] text-gray-400 font-mono break-words">
                      Benchmark: <span className="text-gray-300 font-semibold">{param.benchmark}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 bg-gray-950/70 border border-gray-800/80 rounded-xl p-3 space-y-2">
                  <span className="text-xs font-semibold text-emerald-300 font-mono block">
                    <span className="text-gray-400 font-normal">Actual: </span>
                    {param.actual}
                  </span>

                  {param.interpretation && (
                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      <span className="font-bold text-amber-400">What this means: </span>
                      {param.interpretation}
                    </p>
                  )}
                  {param.whyItMatters && (
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      <span className="font-bold text-gray-300">Why it matters: </span>
                      {param.whyItMatters}
                    </p>
                  )}
                  {param.source && (
                    <p className="text-[10px] text-gray-500">
                      {param.source} · {param.dataQuality}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-gray-800 bg-gray-900/90 flex justify-end shrink-0">
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto justify-center">
            Close Diagnostic
          </Button>
        </div>
      </div>
    </div>
  );
}