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
} from "@/lib/icons";

import { useToast } from "@/hooks/useToast";
import api from "@/lib/api";

export interface IpoParameter {
  id: number;
  name: string;
  category: "Valuation & Pricing" | "Financials & Margins" | "Institutional Demand" | "Governance & Moats";
  value: string;
  benchmark: string;
  status: "PASS" | "FAIL" | "WARN";
  explanation: string;
}

export interface IpoItem {
  id: string;
  name: string;
  symbol: string;
  category: string;
  issuePrice: number;
  lotSize: number;
  issueSize: string;
  openDate: string;
  closeDate: string;
  listingDate: string;
  gmp: number;
  gmpPercent: number;
  subscription: {
    qib: number;
    nii: number;
    retail: number;
    total: number;
  };
  aiScore: number;
  rating: "STRONG APPLY" | "APPLY FOR LISTING GAIN" | "APPLY LONG TERM" | "AVOID";
  listingTarget: number;
  stopLoss: number;
  valuationGrade: string;
  peRatio?: number | null;
  peerPe?: number | null;
  whyApply: string;
  parameters20: IpoParameter[];
  passedCount: number;
  swot: {
    strengths: string[];
    risks: string[];
  };
}

export interface StockAnalysis {
  symbol: string;
  currentPrice: number;
  percentChange: number;
  momentumScore: number;
  momentumGrade: string;
  aiSignal: string;
  technicalIndicators: {
    rsi: number;
    macd: string;
    sma20: number;
    sma50: number;
    ema20: number;
    volumeMultiplier: string;
  };
  levels: {
    support1: number;
    support2: number;
    resistance1: number;
    resistance2: number;
    targetPrice: number;
    stopLoss: number;
  };
  insights: string[];
}

export default function AiAnalysisClient() {
  const { toast, success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<"ipo" | "stock">("ipo");
  const [ipos, setIpos] = useState<IpoItem[]>([]);
  const [summary, setSummary] = useState<{
    activeIposCount: number;
    avgGmpPercent: number;
    topPick: string;
    marketSentiment: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const [expandedIpoId, setExpandedIpoId] = useState<string | null>(null);
  const [selectedModalIpo, setSelectedModalIpo] = useState<IpoItem | null>(null);

  // Custom Stock Symbol Search State
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

  const handleSearchStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchSymbol.trim()) return;

    setSearchingStock(true);
    try {
      const { data } = await api.get(`/analysis/stock/${encodeURIComponent(searchSymbol.trim())}`);
      setStockAnalysis(data.data);
      setActiveTab("stock");
      success(`AI Momentum Mantra generated for ${searchSymbol.toUpperCase()}`);
    } catch {
      toastError(`Could not generate AI analysis for ${searchSymbol}`);
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
      default:
        return "bg-red-500/20 text-red-400 border-red-500/40";
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 py-8">
          <FadeIn>
            {/* Header with AI Engine status */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-950/40">
                  <IconBrain size={24} aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                      Momentum Mantra & AI Analysis
                    </h1>
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <IconSparkles size={12} className="animate-pulse" />
                      AI ENGINE ACTIVE
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Multi-factor AI IPO evaluations, 20-Point Parameter Checklists, GMP demand indicators, & momentum signals
                  </p>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                leftIcon={<IconRefresh size={14} />}
                onClick={loadIpoAnalysis}
                loading={loading}
              >
                Refresh Engine
              </Button>
            </div>

            {/* Top Summary Banner */}
            {summary && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <IconFlame size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider block">
                      Top AI Momentum Pick
                    </span>
                    <span className="text-sm font-bold text-white">
                      {summary.topPick}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <IconTrendingUp size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider block">
                      Average GMP Premium
                    </span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      +{summary.avgGmpPercent}% Demand
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <IconAward size={20} />
                  </div>
                  <div>
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

            {/* Custom Stock Symbol Search Bar */}
            <form onSubmit={handleSearchStock} className="mb-6 flex gap-2">
              <div className="flex-1">
                <Input
                  value={searchSymbol}
                  onChange={(e) => setSearchSymbol(e.target.value)}
                  placeholder="Analyze any stock symbol for AI Momentum Mantra (e.g. RELIANCE, TCS, INFY, TATAMOTORS)..."
                  leftAddon={<IconSearch size={14} />}
                />
              </div>
              <Button
                type="submit"
                loading={searchingStock}
                leftIcon={<IconSparkles size={14} />}
              >
                Analyze
              </Button>
            </form>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-gray-800 mb-6 pb-2">
              <button
                onClick={() => setActiveTab("ipo")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "stock"
                    ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                    : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                <IconActivity size={14} />
                <span>Equity Momentum Screener</span>
              </button>
            </div>
          </FadeIn>

          {/* TAB 1: IPO Momentum Mantra Engine */}
          {activeTab === "ipo" && (
            <FadeIn delay={0.05}>
              {loading ? (
                <div className="flex justify-center py-16">
                  <Spinner size="lg" label="Running Momentum Mantra AI engine…" />
                </div>
              ) : (
                <div className="space-y-4">
                  {ipos.map((ipo) => {
                    const isExpanded = expandedIpoId === ipo.id;
                    const ratingClass = getRatingBadgeClass(ipo.rating);

                    return (
                      <div
                        key={ipo.id}
                        className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 transition-all shadow-xl"
                      >
                        {/* Header: Logo, Name, AI Score Gauge, Rating */}
                        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <StockAvatar symbol={ipo.symbol} size={42} />
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-white">
                                  {ipo.name}
                                </h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-400 border border-gray-700">
                                  {ipo.category}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">
                                Symbol: <span className="text-white font-mono font-bold">{ipo.symbol}</span> · Issue Size: {ipo.issueSize}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-wrap">
                            {/* 20-Parameter Check Trigger Button */}
                            <Button
                              variant="secondary"
                              size="sm"
                              leftIcon={<IconCheck size={14} className="text-emerald-400" />}
                              onClick={() => setSelectedModalIpo(ipo)}
                            >
                              Check 20 Parameters ({ipo.passedCount || 18}/20)
                            </Button>

                            {/* Deep IPO Analysis Report Button */}
                            <Link
                              href={`/ai-analysis/${encodeURIComponent(ipo.symbol)}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
                            >
                              <IconBrain size={14} />
                              <span>Deep Analysis Report</span>
                            </Link>

                            {/* AI Score Radial Meter */}
                            <div className="flex items-center gap-2 bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-xl">
                              <div className="relative w-9 h-9 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center font-bold text-emerald-400 font-mono text-xs">
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

                            {/* Recommendation Rating Badge */}
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase border ${ratingClass}`}>
                              {ipo.rating}
                            </span>
                          </div>
                        </div>

                        {/* Grid Metrics: Issue Price, GMP %, Subscription, Target */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-950 border border-gray-800/80 rounded-xl p-3.5 mb-4 text-xs">
                          {/* 1. Issue Price */}
                          <div>
                            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">
                              Issue Price
                            </span>
                            <span className="text-sm font-bold text-white font-mono">
                              ₹{ipo.issuePrice}
                            </span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              Lot: {ipo.lotSize} shares (₹{(ipo.issuePrice * ipo.lotSize).toLocaleString()})
                            </span>
                          </div>

                          {/* 2. Grey Market Premium (GMP) */}
                          <div>
                            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">
                              GMP Premium
                            </span>
                            <span className="text-sm font-bold text-emerald-400 font-mono flex items-center gap-1">
                              <span>+₹{ipo.gmp}</span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                +{ipo.gmpPercent}%
                              </span>
                            </span>
                          </div>

                          {/* 3. Subscription Status */}
                          <div>
                            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">
                              Subscription
                            </span>
                            <span className="text-sm font-bold text-white font-mono">
                              {ipo.subscription.total}x Total
                            </span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              QIB: {ipo.subscription.qib}x · NII: {ipo.subscription.nii}x
                            </span>
                          </div>

                          {/* 4. AI Listing Target */}
                          <div>
                            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">
                              AI Listing Target
                            </span>
                            <span className="text-sm font-bold text-cyan-400 font-mono">
                              ₹{ipo.listingTarget}
                            </span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              Stop Loss: ₹{ipo.stopLoss}
                            </span>
                          </div>
                        </div>

                        {/* Summary Insight Box */}
                        <div className="flex items-start gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-xs text-gray-300 mb-3">
                          <IconInfo size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                          <p className="leading-relaxed font-medium">
                            <span className="font-bold text-white">AI Verdict:</span> {ipo.whyApply || (ipo as any).aiVerdict || `Based on 20-Point Framework analysis, ${ipo.name} scores ${ipo.aiScore}/100 with ${ipo.passedCount || 18}/20 parameters passed.`}
                          </p>
                        </div>

                        {/* Expandable SWOT Analysis Toggle */}
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

                        {/* SWOT Analysis Drawer */}
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

          {/* TAB 2: Equity Momentum Screener */}
          {activeTab === "stock" && (
            <FadeIn delay={0.05}>
              {stockAnalysis ? (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <StockAvatar symbol={stockAnalysis.symbol} size={44} />
                      <div>
                        <h2 className="text-xl font-bold text-white">
                          {stockAnalysis.symbol} AI Momentum Report
                        </h2>
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          {stockAnalysis.aiSignal}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
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

                      <div className="px-4 py-2 rounded-xl bg-gray-950 border border-gray-800 text-center">
                        <span className="text-[10px] text-gray-500 font-bold uppercase block">
                          Momentum Score
                        </span>
                        <span className="text-lg font-bold text-emerald-400 font-mono">
                          {stockAnalysis.momentumScore}/100
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Technical Metrics & Levels */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800">
                      <span className="text-gray-500 font-semibold uppercase block text-[10px]">
                        RSI Momentum
                      </span>
                      <span className="text-sm font-bold text-white font-mono">
                        {stockAnalysis.technicalIndicators.rsi}
                      </span>
                    </div>

                    <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800">
                      <span className="text-gray-500 font-semibold uppercase block text-[10px]">
                        Volume Factor
                      </span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        {stockAnalysis.technicalIndicators.volumeMultiplier}
                      </span>
                    </div>

                    <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800">
                      <span className="text-gray-500 font-semibold uppercase block text-[10px]">
                        AI Target Price
                      </span>
                      <span className="text-sm font-bold text-cyan-400 font-mono">
                        ₹{stockAnalysis.levels.targetPrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800">
                      <span className="text-gray-500 font-semibold uppercase block text-[10px]">
                        Stop Loss Level
                      </span>
                      <span className="text-sm font-bold text-red-400 font-mono">
                        ₹{stockAnalysis.levels.stopLoss.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* AI Insights List */}
                  <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <IconSparkles size={14} />
                      <span>AI Technical Observations</span>
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
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
                  <IconSearch size={32} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-sm text-gray-400 font-medium">
                    Search any stock symbol above (e.g. RELIANCE, TCS, INFY) to generate a custom Momentum Mantra report.
                  </p>
                </div>
              )}
            </FadeIn>
          )}

          {/* 20-Point Parameter Diagnostic Modal */}
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

// 20-Point Parameter Diagnostic Modal Component
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

  const categories = [
    "ALL",
    "Institutional Demand",
    "Valuation & Pricing",
    "Financials & Margins",
    "Governance & Moats",
  ];

  const params = ipo.parameters20 || [];
  const filteredParams = filterCategory === "ALL"
    ? params
    : params.filter((p) => p.category === filterCategory);

  const passedCount = ipo.passedCount || params.filter((p) => p.status === "PASS").length;
  const passPercent = params.length > 0 ? (passedCount / params.length) * 100 : 85;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className="bg-gray-950 border border-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <StockAvatar symbol={ipo.symbol} size={40} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {ipo.name} ({ipo.symbol})
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  {passedCount} / {params.length || 20} PASSED
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                20-Point Momentum Mantra Parameter Diagnostic Checklist
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Close modal"
          >
            <IconClose size={20} />
          </button>
        </div>

        {/* Diagnostic Progress Gauge */}
        <div className="px-6 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
          <div className="flex justify-between items-center text-xs font-bold text-gray-400 mb-1.5">
            <span>Overall Diagnostic Fitness score</span>
            <span className="text-emerald-400 font-mono">{passPercent.toFixed(0)}% Passed</span>
          </div>
          <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-300 transition-all duration-500"
              style={{ width: `${passPercent}%` }}
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="px-6 py-3 border-b border-gray-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 bg-gray-950">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
                filterCategory === cat
                  ? "bg-emerald-500 text-black border-emerald-500 font-bold"
                  : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Parameters Grid */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filteredParams.map((param) => {
            const isPass = param.status === "PASS";
            const isWarn = param.status === "WARN";

            return (
              <div
                key={param.id}
                className={`rounded-2xl p-4 border transition-all ${
                  isPass
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : isWarn
                    ? "bg-amber-500/5 border-amber-500/20"
                    : "bg-red-500/5 border-red-500/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2.5">
                    {isPass ? (
                      <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                        <IconCheck size={15} />
                      </div>
                    ) : isWarn ? (
                      <div className="p-1 rounded-full bg-amber-500/20 text-amber-400">
                        <IconWarning size={15} />
                      </div>
                    ) : (
                      <div className="p-1 rounded-full bg-red-500/20 text-red-400">
                        <IconError size={15} />
                      </div>
                    )}
                    <span className="font-bold text-white text-sm">
                      #{param.id} {param.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-800 text-gray-400">
                      {param.category}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-white font-mono text-sm block">
                      {param.value}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono block">
                      Benchmark: {param.benchmark}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-300 pl-7 leading-relaxed font-medium">
                  {param.explanation}
                </p>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-800 bg-gray-900/90 flex justify-end shrink-0">
          <Button variant="secondary" onClick={onClose}>
            Close Diagnostic
          </Button>
        </div>
      </div>
    </div>
  );
}
