"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";
import FadeIn from "@/components/FadeIn";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import StockAvatar from "@/components/StockAvatar";

import {
  IconArrowLeft,
  IconCheck,
  IconBuilding,
  IconTarget,
  IconShield,
  IconCheckCircle,
  IconRefresh,
  IconTrendingUp,
  IconBookmark,
  IconError,
  IconWarning,
  IconLightbulb,
  IconDollar,
  IconPercent,
  IconPieChart,
  IconUsers,
  IconExternalLink,
  IconCalendar,
  IconInfo,
  IconChevronDown,
  IconChevronUp,
} from "@/lib/icons";

import { useToast } from "@/hooks/useToast";
import api from "@/lib/api";

interface IpoDetails {
  issueType?: string;
  saleType?: string;
  totalIssueSize?: string;
  freshIssue?: string;
  ofs?: string;
  priceBand?: string;
  issuePrice?: string;
  faceValue?: string;
  lotSize?: string;
  listing?: string;
  marketCap?: string;
  employeeDiscount?: string;
  shareHoldingPreIssue?: string;
  shareHoldingPostIssue?: string;
  registrar?: string;
  leadManagers?: string;
  prePromoterHolding?: string;
  postPromoterHolding?: string;
}

interface IpoDates {
  openDate?: string;
  closeDate?: string;
  allotmentDate?: string;
  refundsDate?: string;
  dematCreditDate?: string;
  listingDate?: string;
}

interface SeriesPoint {
  latest?: number;
  prev?: number;
  oldest?: number;
  spanYears?: number;
}

interface KpiTrend {
  latest: number;
  prev?: number;
  changePp?: number;
  relChange?: number;
  direction: "improving" | "declining" | "flat";
  sourceLabel?: string;
}

interface Financials {
  periods: string[];
  currency?: string;
  rowLabels?: string[];

  totalIncome?: SeriesPoint;
  totalIncomeSourceLabel?: string;
  pat?: SeriesPoint;
  operatingProfit?: SeriesPoint;
  operatingProfitSourceLabel?: string;
  assets?: SeriesPoint;
  borrowing?: SeriesPoint;
  netWorth?: SeriesPoint;
  reserves?: SeriesPoint;
  operatingCashFlow?: SeriesPoint;
  hasOperatingCashFlow?: boolean;

  totalIncomeGrowth?: number;
  patGrowth?: number;
  operatingProfitGrowth?: number;
  totalIncomeCagr?: number;
  patCagr?: number;
  assetGrowth?: number;
  debtGrowth?: number;
  netWorthGrowth?: number;
  debtToEquity?: number;
  operatingMargin?: number;
  operatingMarginPrev?: number;

  kpi?: {
    periods?: string[];
    roe?: KpiTrend;
    roce?: KpiTrend;
    ronw?: KpiTrend;
    patMargin?: KpiTrend;
    ebitdaMargin?: KpiTrend;
    debtEquity?: KpiTrend;
    nav?: KpiTrend;
    priceToBook?: KpiTrend;
  };

  epsPre?: number;
  epsPost?: number;
  pePre?: number;
  pePost?: number;
  marketCapPre?: string;
  marketCapPost?: string;
}

export type Verdict = "Pass" | "Caution" | "Fail" | "Not Assessed" | "Info";

export interface IpoParam {
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

interface Flag {
  label: string;
  detail?: string;
}

export interface DeepIpoData {
  company: {
    name: string;
    symbol: string;
    category: "MAINBOARD" | "SME";
    sector?: string;
    status: "OPEN" | "UPCOMING" | "CLOSED";
    logoUrl?: string;
    sourceUrl?: string;
    allotmentStatusUrl?: string;
    about: string;
    details: IpoDetails;
    dates: IpoDates;
    lotBreakup: { category: string; lots: string; shares: string; amount: string }[];
    reservation?: { qib?: number; nii?: number; retail?: number };
    anchor?: { bidDate?: string; sharesOffered?: string; anchorPortionCr?: number; allocationPct?: number };
    objectsOfIssue: { title: string; amount?: string }[];
    ofsShareholders: { name: string; category?: string; shares?: string; amountCr?: number }[];
    expenses: { title: string; amountCr?: number }[];
    brokerRecommendation?: {
      subscribe: number;
      mayApply: number;
      neutral: number;
      avoid: number;
      source?: string;
      memberVotes?: { subscribe: number; mayApply: number; neutral: number; avoid: number };
    };
    subscription?: {
      total?: number;
      qib?: number;
      nii?: number;
      bNii?: number;
      sNii?: number;
      retail?: number;
      employee?: number;
    };
    sectorPeers?: { name: string; issueType?: string; peRatio?: number; listingGainPct?: number }[];
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
    financials: Financials;
    financialCards: {
      period: string;
      totalIncome?: number;
      pat?: number;
      operatingProfit?: number;
      netWorth?: number;
      assets?: number;
      borrowing?: number;
    }[];
    dataNotes?: string[];
    highlights: string[];
    flags: { green: Flag[]; neutral: Flag[]; red: Flag[] };
    riskFactorAnalysis: {
      overallRating: string;
      risks: { id: number; title: string; severity: "High Risk" | "Medium Risk" | "Low Risk"; description: string }[];
    };
    finalObservations: {
      positives: string[];
      watchItems: string[];
      concerns: string[];
      closingSummary: string;
      closingRating: string;
    };
    finalDashboard: {
      counts: {
        greenFlags: number;
        yellowFlags: number;
        redFlags: number;
        notAssessed: number;
        informational: number;
        totalParameters: number;
      };
      categorySummary: { category: string; status: string; type: "strong" | "mixed" | "weak" | "unknown"; driver?: string }[];
    };
  };
  metrics: {
    aiScore: number;
    rating: string;
    rawRating: string;
    passedCount: number;
    parameterCount: number;
    scoredCount: number;
    weightEarned: number;
    weightTotal: number;
    coveragePct: number;
    confidence: "High" | "Medium" | "Low";
    overallRisk: string;
    verdictCounts: { pass: number; caution: number; fail: number; notAssessed: number; info: number };
    appliedCaps: { cap: string; reason: string }[];
  };
  resultGuide: {
    howScoreWorks: string[];
    verdictLegend: { verdict: string; meaning: string }[];
    ratingScale: { rating: string; band: string; meaning: string }[];
    ratingAdjustment: {
      rawRating: string;
      finalRating: string;
      explanation: string;
      caps: { cap: string; reason: string }[];
    };
    weightByCategory: {
      category: string;
      weight: number;
      designedWeight: number;
      unassessedWeight: number;
      sharePct: number;
    }[];
    dataSources: string[];
    limitations: string[];
  };
  parameters: IpoParam[];
}

const VERDICT_STYLE: Record<Verdict, { pill: string; dot: string; row: string; label: string }> = {
  Pass: {
    pill: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    dot: "bg-emerald-400",
    row: "hover:bg-emerald-950/20",
    label: "Pass",
  },
  Caution: {
    pill: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    dot: "bg-amber-400",
    row: "bg-amber-500/5 hover:bg-amber-500/10",
    label: "Caution",
  },
  Fail: {
    pill: "bg-red-500/20 text-red-400 border-red-500/40",
    dot: "bg-red-400",
    row: "bg-red-500/5 hover:bg-red-500/10",
    label: "Fail",
  },
  "Not Assessed": {
    pill: "bg-gray-700/40 text-gray-300 border-gray-600/50",
    dot: "bg-gray-400",
    row: "bg-gray-800/20 hover:bg-gray-800/40",
    label: "Not Assessed",
  },
  Info: {
    pill: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    dot: "bg-blue-400",
    row: "hover:bg-blue-950/20",
    label: "Info",
  },
};

function VerdictPill({ verdict }: { verdict: Verdict }) {
  const s = VERDICT_STYLE[verdict] ?? VERDICT_STYLE.Caution;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold border whitespace-nowrap ${s.pill}`}>
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

const fmtCr = (v?: number) => (typeof v === "number" ? `₹${v.toLocaleString("en-IN")} Cr` : "—");

function RatioChip({ label, trend }: { label: string; trend?: KpiTrend }) {
  if (!trend) return null;
  const declining = trend.direction === "declining";
  const improving = trend.direction === "improving";
  const tone = declining
    ? "bg-amber-500/10 text-amber-300 border-amber-500/25"
    : improving
      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/25"
      : "bg-cyan-500/10 text-cyan-300 border-cyan-500/25";

  return (
    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${tone}`}>
      <IconPercent size={13} />
      <span>
        {label} {trend.latest}%
      </span>
      {typeof trend.prev === "number" && (
        <span className="text-[10px] font-semibold opacity-80">
          {declining ? "▼" : improving ? "▲" : "▬"} from {trend.prev}%
        </span>
      )}
    </span>
  );
}

export default function IpoDeepAnalysisClient() {
  const params = useParams();
  const rawSym = params?.symbol ? (params.symbol as string) : "";
  const { toast, error: toastError } = useToast();

  const [data, setData] = useState<DeepIpoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openParamId, setOpenParamId] = useState<number | null>(null);

  const loadDeepAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/analysis/ipo/deep/${encodeURIComponent(rawSym)}`);
      setData(res.data.data);
    } catch {
      toastError(`Could not load deep IPO analysis for ${rawSym}`);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [rawSym, toastError]);

  useEffect(() => {
    loadDeepAnalysis();
  }, [loadDeepAnalysis]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0b0e14] text-white">
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          <div className="flex items-center justify-between">
            <Link
              href="/ai-analysis"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 text-xs font-semibold transition-colors"
            >
              <IconArrowLeft size={14} />
              <span>Back to AI Analysis Hub</span>
            </Link>

            <div className="flex items-center gap-2">
              {data?.company.allotmentStatusUrl && (
                <a
                  href={data.company.allotmentStatusUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  <IconCalendar size={13} />
                  <span>Check Allotment Status</span>
                  <IconExternalLink size={11} className="text-gray-500" />
                </a>
              )}
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<IconRefresh size={12} />}
                onClick={loadDeepAnalysis}
                loading={loading}
              >
                Refresh from Chittorgarh
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" label="Loading Chittorgarh & Live IPO Analytics…" />
            </div>
          ) : !data ? (
            <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <p className="text-sm text-gray-400 font-medium">
                Could not retrieve deep IPO analytics for {rawSym}.
              </p>
            </div>
          ) : (
            <>
              <FadeIn>
                <div className="bg-gray-900 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 flex items-center justify-between flex-wrap gap-4 shadow-2xl relative overflow-hidden">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
                      {data.company.name.toUpperCase()} IPO REVIEW
                    </h1>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-400 border border-gray-700">
                        {data.company.category}
                      </span>
                      {data.company.sector && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-400 border border-gray-700">
                          {data.company.sector}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          data.company.status === "OPEN"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                        }`}
                      >
                        {data.company.status}
                      </span>
                      {data.company.sourceUrl && (
                        <a
                          href={data.company.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          <IconExternalLink size={11} />
                          <span>Source: Chittorgarh</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-gray-950 border border-gray-800 p-3 rounded-xl">
                    <StockAvatar symbol={data.company.symbol} logoUrl={data.company.logoUrl} size={40} />
                    <div>
                      <span className="font-extrabold text-white text-sm block">{data.company.name}</span>
                      <span className="text-xs text-emerald-400 font-mono font-bold">
                        {data.metrics.aiScore}/100 · {data.metrics.rating}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono block">
                        {data.metrics.passedCount}/{data.metrics.scoredCount} scored parameters passed ·{" "}
                        {data.metrics.confidence} confidence
                      </span>
                    </div>
                  </div>
                </div>
              </FadeIn>

              {data.metrics.appliedCaps.length > 0 && (
                <FadeIn delay={0.03}>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <IconWarning size={18} className="text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h3 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider">
                          Why this rating was lowered
                        </h3>
                        <p className="text-xs text-gray-300 font-medium leading-relaxed">
                          The weighted score of {data.metrics.aiScore}/100 on its own maps to{" "}
                          <span className="font-bold text-gray-100">{data.metrics.rawRating}</span>. It was capped at{" "}
                          <span className="font-bold text-amber-300">{data.metrics.rating}</span> because a weighted
                          average can dilute a single disqualifying fact.
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {data.metrics.appliedCaps.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-300 leading-relaxed">
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold shrink-0 whitespace-nowrap">
                            Cap: {c.cap}
                          </span>
                          <span>{c.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeIn>
              )}

              {data.company.dataNotes && data.company.dataNotes.length > 0 && (
                <FadeIn delay={0.04}>
                  <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4 space-y-2">
                    <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <IconInfo size={15} className="text-gray-400 shrink-0 mt-0.5" />
                      <span>Data labelling notes for this issue</span>
                    </h3>
                    <ul className="space-y-1.5">
                      {data.company.dataNotes.map((n, i) => (
                        <li key={i} className="text-[11px] text-gray-400 leading-relaxed flex items-start gap-2">
                          <span className="text-gray-600 shrink-0">•</span>
                          <span>{n}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeIn>
              )}

              <FadeIn delay={0.05}>
                <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 sm:p-7 space-y-6 shadow-xl">
                  <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-black font-extrabold flex items-center justify-center text-sm shadow-md shadow-emerald-500/30">
                      1
                    </div>
                    <div className="flex items-center gap-2">
                      <IconBuilding size={20} className="text-emerald-400" />
                      <h2 className="text-lg sm:text-xl font-extrabold text-emerald-400 tracking-wide uppercase">
                        COMPANY INTRODUCTION
                      </h2>
                    </div>
                  </div>

                  <div className="bg-gray-950/70 border border-gray-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <IconBookmark size={14} className="text-emerald-400" />
                      <span>About the Company</span>
                    </h3>
                    <div className="text-xs text-gray-300 leading-relaxed space-y-2 font-medium">
                      {data.company.about
                        ? data.company.about.split("\n\n").map((para, i) => <p key={i}>{para}</p>)
                        : <p className="text-gray-500 italic">No company description published yet.</p>}
                    </div>
                  </div>

                  {data.company.financialCards.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                        Key Financials (FY {data.company.financialCards[0]?.period}):
                      </h4>
                      <div className="flex flex-wrap gap-2.5">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-gray-200 font-medium">
                          <IconDollar size={14} className="text-emerald-400 shrink-0" />
                          <span>
                            {data.company.financials.totalIncomeSourceLabel || "Total Income"}{" "}
                            {fmtCr(data.company.financialCards[0]?.totalIncome)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-gray-200 font-medium">
                          <IconTrendingUp size={14} className="text-emerald-400 shrink-0" />
                          <span>PAT {fmtCr(data.company.financialCards[0]?.pat)}</span>
                        </div>
                        {data.company.financialCards[0]?.operatingProfit !== undefined && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-gray-200 font-medium">
                            <IconBarChartIcon />
                            <span>Operating Profit {fmtCr(data.company.financialCards[0]?.operatingProfit)}</span>
                          </div>
                        )}
                        {data.company.financials.netWorth?.latest !== undefined && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-gray-200 font-medium">
                            <IconShield size={14} className="text-cyan-400 shrink-0" />
                            <span>Net Worth {fmtCr(data.company.financials.netWorth.latest)}</span>
                          </div>
                        )}
                        {data.company.financials.assets?.latest !== undefined && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-gray-200 font-medium">
                            <IconPieChart size={14} className="text-amber-400 shrink-0" />
                            <span>Total Assets {fmtCr(data.company.financials.assets.latest)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-gray-200 font-medium">
                          <IconDollar size={14} className="text-gray-400 shrink-0" />
                          <span>
                            Operating Cash Flow{" "}
                            {data.company.financials.hasOperatingCashFlow
                              ? fmtCr(data.company.financials.operatingCashFlow?.latest)
                              : "not published by source"}
                          </span>
                        </div>
                      </div>
                      {data.company.financials.operatingProfitSourceLabel && (
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                          Operating Profit is the row the source publishes as &quot;
                          {data.company.financials.operatingProfitSourceLabel}&quot;. It excludes other income and may
                          differ from the EBITDA/PBIDT stated in the RHP — it is not quoted here as reported EBITDA.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Return &amp; Margin Ratios (Chittorgarh KPI table
                      {data.company.financials.kpi?.periods?.length
                        ? `, ${data.company.financials.kpi.periods.join(" vs ")}`
                        : ""}
                      ):
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <RatioChip label="ROE" trend={data.company.financials.kpi?.roe} />
                      <RatioChip label="ROCE" trend={data.company.financials.kpi?.roce} />
                      <RatioChip label="RoNW" trend={data.company.financials.kpi?.ronw} />
                      <RatioChip label="PAT Margin" trend={data.company.financials.kpi?.patMargin} />
                      <RatioChip label="Operating Margin" trend={data.company.financials.kpi?.ebitdaMargin} />
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      Where two periods are published, the arrow shows the direction. A high ratio that is falling is
                      shown in amber — the level is strong but the trend is not, and the fresh equity raised in this
                      issue dilutes return ratios further before it earns anything.
                      {data.company.financials.kpi?.ebitdaMargin &&
                        " The source calls its margin row “EBITDA Margin”; on the underlying figures it is an operating profit margin."}
                    </p>
                  </div>

                  <div className="bg-emerald-500/10 border-l-4 border-l-emerald-500 border-y border-r border-gray-800 rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-4 text-emerald-400 font-bold">
                    <div className="flex items-center gap-2">
                      <IconTrendingUp size={18} />
                      <span className="text-lg font-mono tracking-tight">
                        {data.company.details.marketCap ? `Market Cap: ${data.company.details.marketCap}` : "Market Cap: Not yet listed"}
                      </span>
                    </div>
                    <div className="text-xs uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-500/30">
                      {data.metrics.rating}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                        <IconPieChart size={16} className="text-emerald-400" />
                        <span>Issue Structure</span>
                      </h4>
                      <div className="space-y-1.5 text-xs text-gray-300">
                        <div>Total Issue: <span className="text-white font-mono">{data.company.details.totalIssueSize || "—"}</span></div>
                        <div>Fresh Issue: <span className="text-emerald-400 font-mono">{data.company.details.freshIssue || "—"}</span></div>
                        <div>OFS: <span className="text-amber-400 font-mono">{data.company.details.ofs || "Nil"}</span></div>
                      </div>
                    </div>

                    <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                        <IconUsers size={16} className="text-amber-400" />
                        <span>Broker Recommendation</span>
                      </h4>
                      {data.company.brokerRecommendation ? (
                        <ul className="space-y-2 text-xs text-gray-300 font-medium">
                          <li className="flex items-center justify-between"><span>Subscribe</span><span className="text-emerald-400 font-mono font-bold">{data.company.brokerRecommendation.subscribe}</span></li>
                          <li className="flex items-center justify-between"><span>May Apply</span><span className="text-cyan-400 font-mono font-bold">{data.company.brokerRecommendation.mayApply}</span></li>
                          <li className="flex items-center justify-between"><span>Neutral</span><span className="text-gray-400 font-mono font-bold">{data.company.brokerRecommendation.neutral}</span></li>
                          <li className="flex items-center justify-between"><span>Avoid</span><span className="text-red-400 font-mono font-bold">{data.company.brokerRecommendation.avoid}</span></li>
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-500 italic">No broker reviews published yet.</p>
                      )}
                    </div>
                  </div>

                  {data.company.financialCards.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                        <IconBarChartIcon />
                        <span>Financial Snapshot ({data.company.financials.currency || "₹ Crore"}, as published)</span>
                      </h4>
                      <div className="overflow-x-auto rounded-2xl border border-gray-800">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-950 border-b border-gray-800 text-gray-400 uppercase font-semibold">
                            <tr>
                              <th scope="col" className="text-left px-4 py-3">
                                Metric (source label)
                              </th>
                              {data.company.financialCards.map((c) => (
                                <th key={c.period} scope="col" className="text-right px-4 py-3 whitespace-nowrap">
                                  {c.period}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800 text-gray-200 font-medium">
                            {(
                              [
                                [data.company.financials.totalIncomeSourceLabel || "Total Income", "totalIncome", "text-gray-200"],
                                ["Profit After Tax", "pat", "text-emerald-400"],
                                ["Operating Profit", "operatingProfit", "text-cyan-400"],
                                ["Net Worth", "netWorth", "text-cyan-300"],
                                ["Assets", "assets", "text-amber-400"],
                                ["Total Borrowing", "borrowing", "text-gray-300"],
                              ] as const
                            )
                              .filter(([, key]) => data.company.financialCards.some((c) => c[key] !== undefined))
                              .map(([label, key, color]) => (
                                <tr key={key} className="hover:bg-gray-950/60 transition-colors">
                                  <td className="px-4 py-3 font-bold text-gray-400 whitespace-nowrap">{label}</td>
                                  {data.company.financialCards.map((c) => (
                                    <td key={c.period} className={`px-4 py-3 font-mono text-right ${color}`}>
                                      {c[key] !== undefined ? c[key]!.toLocaleString("en-IN") : "—"}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        {typeof data.company.financials.totalIncomeCagr === "number" && (
                          <span className="px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800 text-gray-300 font-mono">
                            {data.company.financials.totalIncomeSourceLabel || "Total Income"} CAGR{" "}
                            {data.company.financials.totalIncomeCagr}%
                          </span>
                        )}
                        {typeof data.company.financials.patCagr === "number" && (
                          <span className="px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800 text-gray-300 font-mono">
                            PAT CAGR {data.company.financials.patCagr}%
                          </span>
                        )}
                        {typeof data.company.financials.netWorthGrowth === "number" && (
                          <span className="px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800 text-gray-300 font-mono">
                            Net Worth {data.company.financials.netWorthGrowth >= 0 ? "+" : ""}
                            {data.company.financials.netWorthGrowth}% YoY
                          </span>
                        )}
                        {typeof data.company.financials.debtToEquity === "number" && (
                          <span className="px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800 text-gray-300 font-mono">
                            D/E {data.company.financials.debtToEquity}x
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {data.company.highlights.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-gray-800">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                        <IconShield size={16} className="text-amber-400" />
                        <span>Genuine Positives</span>
                      </h4>
                      <p className="text-[10px] text-gray-500">
                        Only facts that are favourable to a new shareholder appear here. An Offer-for-Sale component is
                        never listed as a positive — that money goes to selling shareholders, not the company.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {data.company.highlights.map((adv, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-gray-200 font-medium"
                          >
                            <IconCheck size={14} className="text-emerald-400 shrink-0" />
                            <span>{adv}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </FadeIn>

              <FadeIn delay={0.08}>
                <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 sm:p-7 space-y-6 shadow-xl">
                  <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-black font-extrabold flex items-center justify-center text-sm shadow-md shadow-emerald-500/30">
                      2
                    </div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-emerald-400 tracking-wide uppercase">
                      IPO DETAILS & TIMELINE DATES
                    </h2>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      IPO Important Dates & Event Schedule
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                      {([
                        ["IPO Open", data.company.dates.openDate, "text-emerald-400"],
                        ["IPO Close", data.company.dates.closeDate, "text-red-400"],
                        ["Allotment", data.company.dates.allotmentDate, "text-amber-400"],
                        ["Refunds", data.company.dates.refundsDate, "text-cyan-400"],
                        ["Demat Credit", data.company.dates.dematCreditDate, "text-purple-400"],
                        ["Listing Date", data.company.dates.listingDate, "text-emerald-300"],
                      ] as const).map(([label, value, color]) => (
                        <div key={label} className="bg-gray-950 border border-gray-800 p-3 rounded-xl text-center">
                          <span className="text-[10px] text-gray-500 font-bold uppercase block">{label}</span>
                          <span className={`text-xs font-extrabold font-mono ${color}`}>{value || "Not announced"}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-gray-800">
                    <table className="w-full text-xs">
                      <thead className="bg-emerald-500/10 border-b border-gray-800 text-emerald-400 uppercase font-bold">
                        <tr>
                          <th scope="col" className="text-left px-5 py-3.5 w-1/3">
                            PARTICULAR
                          </th>
                          <th scope="col" className="text-left px-5 py-3.5">
                            DETAILS
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800 text-gray-200 font-medium">
                        {[
                          ["Issue Type", data.company.details.issueType],
                          ["Total Issue Size", data.company.details.totalIssueSize],
                          ["Fresh Issue", data.company.details.freshIssue],
                          ["Offer For Sale (OFS)", data.company.details.ofs],
                          ["Price Band", data.company.details.priceBand],
                          ["Face Value", data.company.details.faceValue],
                          ["Lot Size", data.company.details.lotSize],
                          ["Listing Exchanges", data.company.details.listing],
                          ["Market Cap", data.company.details.marketCap],
                          ["Promoter Shareholding Pre-Issue", data.company.details.prePromoterHolding],
                          ["Promoter Shareholding Post-Issue", data.company.details.postPromoterHolding],
                          ["Registrar", data.company.details.registrar],
                          ["Lead Manager(s)", data.company.details.leadManagers],
                        ]
                          .filter(([, val]) => Boolean(val))
                          .map(([label, val]) => (
                            <tr key={label} className="hover:bg-gray-950/60 transition-colors">
                              <td className="px-5 py-3.5 text-gray-400 font-bold">{label}</td>
                              <td className="px-5 py-3.5 text-white font-mono">{val}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {data.company.lotBreakup.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        IPO Lot Size & Category Investment Table
                      </h3>
                      <div className="overflow-x-auto rounded-2xl border border-gray-800">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-950 border-b border-gray-800 text-gray-400 uppercase font-semibold">
                            <tr>
                              <th scope="col" className="text-left px-4 py-3">APPLICATION CATEGORY</th>
                              <th scope="col" className="text-left px-4 py-3">LOTS</th>
                              <th scope="col" className="text-left px-4 py-3">SHARES</th>
                              <th scope="col" className="text-right px-4 py-3">TOTAL INVESTMENT</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800 text-gray-200 font-medium">
                            {data.company.lotBreakup.map((lb, idx) => (
                              <tr key={idx} className="hover:bg-gray-950/60 transition-colors">
                                <td className="px-4 py-3 font-bold text-white">{lb.category}</td>
                                <td className="px-4 py-3 font-mono text-gray-300">{lb.lots}</td>
                                <td className="px-4 py-3 font-mono text-gray-300">{lb.shares}</td>
                                <td className="px-4 py-3 font-mono font-bold text-emerald-400 text-right">{lb.amount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {(data.company.reservation?.qib !== undefined || data.company.anchor?.allocationPct !== undefined) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      {data.company.reservation && (
                        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 space-y-2">
                          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Investor Category Reservation</h4>
                          <div className="text-xs text-gray-300 space-y-1 font-mono">
                            <div>QIB: <span className="text-white">{data.company.reservation.qib ?? "—"}%</span></div>
                            <div>NII (HNI): <span className="text-white">{data.company.reservation.nii ?? "—"}%</span></div>
                            <div>Retail: <span className="text-white">{data.company.reservation.retail ?? "—"}%</span></div>
                          </div>
                        </div>
                      )}
                      {data.company.anchor && (
                        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 space-y-2">
                          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Anchor Investor Details</h4>
                          <div className="text-xs text-gray-300 space-y-1 font-mono">
                            <div>Bid Date: <span className="text-white">{data.company.anchor.bidDate || "—"}</span></div>
                            <div>Shares Offered: <span className="text-white">{data.company.anchor.sharesOffered || "—"}</span></div>
                            <div>Anchor Portion: <span className="text-white">{data.company.anchor.anchorPortionCr ? `₹${data.company.anchor.anchorPortionCr} Cr` : "—"}</span></div>
                            <div>% of Total Issue: <span className="text-emerald-400">{data.company.anchor.allocationPct !== undefined ? `${data.company.anchor.allocationPct}%` : "—"}</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {data.company.ofsShareholders.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        Offer-for-Sale: Selling Shareholders
                      </h3>
                      {data.company.issueSplit?.promoterSellerNames?.length ? (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 font-medium flex items-start gap-2">
                          <IconWarning size={15} className="text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            {data.company.issueSplit.promoterSellerNames.length} promoter shareholder
                            {data.company.issueSplit.promoterSellerNames.length > 1 ? "s are" : " is"} selling{" "}
                            {fmtCr(data.company.issueSplit.promoterOfsAmountCr)} in this issue. That money goes to the
                            sellers, not to the company.
                          </span>
                        </div>
                      ) : null}
                      <div className="overflow-x-auto rounded-2xl border border-gray-800">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-950 border-b border-gray-800 text-gray-400 uppercase font-semibold">
                            <tr>
                              <th scope="col" className="text-left px-4 py-3">NAME</th>
                              <th scope="col" className="text-left px-4 py-3">CATEGORY</th>
                              <th scope="col" className="text-left px-4 py-3">SHARES OFFERED</th>
                              <th scope="col" className="text-right px-4 py-3">AMOUNT (₹ CR)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800 text-gray-200 font-medium">
                            {data.company.ofsShareholders.map((s, idx) => (
                              <tr key={idx} className="hover:bg-gray-950/60 transition-colors">
                                <td className="px-4 py-3 font-bold text-white">{s.name}</td>
                                <td className="px-4 py-3">
                                  <span
                                    className={
                                      /promoter/i.test(s.category || "")
                                        ? "px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                        : "text-gray-300"
                                    }
                                  >
                                    {s.category || "—"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-mono text-gray-300">{s.shares || "—"}</td>
                                <td className="px-4 py-3 font-mono text-amber-400 text-right">{s.amountCr ?? "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {data.company.subscription && typeof data.company.subscription.total === "number" && (
                    <div className="space-y-2 pt-2">
                      <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        Subscription Status (times subscribed)
                      </h3>
                      <div className="flex flex-wrap gap-2.5">
                        {(
                          [
                            ["Overall", data.company.subscription.total],
                            ["QIB", data.company.subscription.qib],
                            ["NII", data.company.subscription.nii],
                            ["Retail", data.company.subscription.retail],
                            ["Employee", data.company.subscription.employee],
                          ] as const
                        )
                          .filter(([, v]) => typeof v === "number")
                          .map(([label, v]) => (
                            <div
                              key={label}
                              className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-center min-w-23"
                            >
                              <span className="text-[10px] text-gray-500 font-bold uppercase block">{label}</span>
                              <span
                                className={`text-sm font-extrabold font-mono ${
                                  (v as number) >= 5
                                    ? "text-emerald-400"
                                    : (v as number) >= 1
                                      ? "text-amber-400"
                                      : "text-red-400"
                                }`}
                              >
                                {(v as number).toFixed(2)}x
                              </span>
                            </div>
                          ))}
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        Subscription multiples are real money bid at the offer price, which makes them the most direct
                        demand signal available. The QIB figure carries the most weight because institutions do the
                        deepest diligence.
                      </p>
                    </div>
                  )}

                  {data.company.sectorPeers && data.company.sectorPeers.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        Recently Listed {data.company.sector || "Sector"} IPOs — Actual Listing Outcomes
                      </h3>
                      <div className="overflow-x-auto rounded-2xl border border-gray-800">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-950 border-b border-gray-800 text-gray-400 uppercase font-semibold">
                            <tr>
                              <th scope="col" className="text-left px-4 py-3">COMPANY</th>
                              <th scope="col" className="text-left px-4 py-3">BOARD</th>
                              <th scope="col" className="text-right px-4 py-3">P/E AT ISSUE</th>
                              <th scope="col" className="text-right px-4 py-3">LISTING GAIN</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800 text-gray-200 font-medium">
                            {data.company.sectorPeers.map((p, idx) => (
                              <tr key={idx} className="hover:bg-gray-950/60 transition-colors">
                                <td className="px-4 py-3 font-bold text-white">{p.name}</td>
                                <td className="px-4 py-3 text-gray-400">{p.issueType || "—"}</td>
                                <td className="px-4 py-3 font-mono text-gray-300 text-right">{p.peRatio ?? "—"}</td>
                                <td
                                  className={`px-4 py-3 font-mono font-bold text-right ${
                                    (p.listingGainPct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"
                                  }`}
                                >
                                  {typeof p.listingGainPct === "number"
                                    ? `${p.listingGainPct >= 0 ? "+" : ""}${p.listingGainPct}%`
                                    : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        This is a small, recency-biased sample. It shows how the market is currently receiving this kind
                        of business, and is used as a sanity check on the offer P/E — not as a full peer valuation.
                      </p>
                    </div>
                  )}
                </div>
              </FadeIn>

              <FadeIn delay={0.09}>
                <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 sm:p-7 space-y-5 shadow-xl">
                  <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-black font-extrabold flex items-center justify-center text-sm shadow-md shadow-emerald-500/30">
                      3
                    </div>
                    <div className="flex items-center gap-2">
                      <IconDollar size={20} className="text-emerald-400" />
                      <h2 className="text-lg sm:text-xl font-extrabold text-emerald-400 tracking-wide uppercase">
                        FUND UTILIZATION
                      </h2>
                    </div>
                  </div>

                  {data.company.issueSplit && typeof data.company.issueSplit.freshPct === "number" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 text-center">
                        <span className="text-[10px] text-gray-500 font-bold uppercase block">Total Issue</span>
                        <span className="text-lg font-extrabold text-white font-mono">
                          {fmtCr(data.company.issueSplit.totalCr)}
                        </span>
                      </div>
                      <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-xl p-4 text-center">
                        <span className="text-[10px] text-emerald-400 font-bold uppercase block">
                          Fresh Issue — to the company
                        </span>
                        <span className="text-lg font-extrabold text-emerald-400 font-mono">
                          {fmtCr(data.company.issueSplit.freshCr)}
                        </span>
                        <span className="text-[10px] text-gray-500 block">
                          {data.company.issueSplit.freshPct}% of issue
                        </span>
                      </div>
                      <div className="bg-gray-800/30 border border-gray-600/40 rounded-xl p-4 text-center">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">
                          OFS — to selling shareholders
                        </span>
                        <span className="text-lg font-extrabold text-gray-300 font-mono">
                          {data.company.issueSplit.ofsCr ? fmtCr(data.company.issueSplit.ofsCr) : "Nil"}
                        </span>
                        <span className="text-[10px] text-gray-500 block">
                          {data.company.issueSplit.ofsPct ?? 0}% of issue
                        </span>
                      </div>
                    </div>
                  )}

                  {data.company.issueSplit?.structureLabel && (
                    <div className="bg-gray-950 border border-gray-800 rounded-xl p-3.5 text-xs text-gray-300 font-medium flex items-start gap-2 leading-relaxed">
                      <IconInfo size={15} className="text-gray-400 shrink-0 mt-0.5" />
                      <span>
                        Structure classified as{" "}
                        <span className="font-bold text-white">{data.company.issueSplit.structureLabel}</span>, based on
                        the fresh-issue share of the total raise. The OFS portion is not counted as a positive — that
                        money goes to the selling shareholders, not into the business.
                      </span>
                    </div>
                  )}

                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Objects of the Issue (Actual Allocation, as filed)
                  </h3>

                  {data.company.objectsOfIssue.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {data.company.objectsOfIssue.map((obj, idx) => (
                        <div
                          key={idx}
                          className="bg-[#0f172a] border border-blue-900/50 rounded-2xl p-5 space-y-2 hover:border-blue-700/60 transition-all shadow-lg"
                        >
                          <span className="text-2xl font-extrabold text-amber-400 font-mono block">
                            {obj.amount || "—"}
                          </span>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            {obj.title}
                          </h4>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">Objects of the issue not disclosed yet.</p>
                  )}

                  {data.parameters
                    .filter((p) => p.name === "Use of Proceeds" || p.name === "Working Capital Intensity of Objects")
                    .map((p) => (
                      <div
                        key={p.id}
                        className="bg-gray-950 border border-gray-800 rounded-xl p-4 space-y-2 text-xs leading-relaxed"
                      >
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <span className="font-bold text-white">{p.name}</span>
                          <VerdictPill verdict={p.verdict} />
                        </div>
                        <div className="font-mono text-gray-300">{p.actual}</div>
                        <p className="text-gray-400 font-normal">{p.interpretation}</p>
                        <p className="text-[10px] text-gray-500 font-normal">
                          Benchmark: {p.benchmark} · {p.source}
                        </p>
                      </div>
                    ))}
                </div>
              </FadeIn>

              <FadeIn delay={0.1}>
                <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 sm:p-7 space-y-5 shadow-xl">
                  <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-black font-extrabold flex items-center justify-center text-sm shadow-md shadow-emerald-500/30">
                        4
                      </div>
                      <div className="flex items-center gap-2">
                        <IconTarget size={20} className="text-emerald-400" />
                        <h2 className="text-lg sm:text-xl font-extrabold text-emerald-400 tracking-wide uppercase">
                          {data.metrics.parameterCount}-PARAMETER IPO FRAMEWORK
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1.5 rounded-2xl bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40 text-xs">
                        {data.metrics.passedCount} / {data.metrics.scoredCount} PASSED
                      </span>
                      <span className="px-3 py-1.5 rounded-2xl bg-gray-800 text-gray-300 font-bold border border-gray-700 text-xs">
                        {data.metrics.weightEarned} / {data.metrics.weightTotal} WEIGHT
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed">
                    Every row is scored against a fixed benchmark and weighted by how much it matters. Click any row to
                    see why the parameter matters, what this specific value means, and exactly which source table the
                    figure came from.
                  </p>

                  <div className="overflow-x-auto rounded-2xl border border-gray-800">
                    <table className="w-full text-xs">
                      <thead className="bg-emerald-500/10 border-b border-gray-800 text-emerald-400 uppercase font-bold">
                        <tr>
                          <th scope="col" className="text-left px-4 py-3.5 w-12">NO.</th>
                          <th scope="col" className="text-left px-4 py-3.5">PARAMETER</th>
                          <th scope="col" className="text-center px-2 py-3.5 w-14">WT</th>
                          <th scope="col" className="text-left px-4 py-3.5">BENCHMARK</th>
                          <th scope="col" className="text-left px-4 py-3.5">ACTUAL</th>
                          <th scope="col" className="text-center px-4 py-3.5 w-32">VERDICT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/80 font-medium">
                        {data.parameters.map((param) => {
                          const style = VERDICT_STYLE[param.verdict] ?? VERDICT_STYLE.Caution;
                          const isOpen = openParamId === param.id;

                          return (
                            <Fragment key={param.id}>
                              <tr
                                className={`transition-colors cursor-pointer ${style.row}`}
                                onClick={() => setOpenParamId(isOpen ? null : param.id)}
                                aria-expanded={isOpen}
                              >
                                <td className="px-4 py-3 font-mono font-bold text-gray-400 text-center">{param.id}</td>
                                <td className="px-4 py-3 font-bold text-white">
                                  <span className="flex items-center gap-1.5">
                                    {param.name}
                                    {isOpen ? (
                                      <IconChevronUp size={12} className="text-gray-500 shrink-0" />
                                    ) : (
                                      <IconChevronDown size={12} className="text-gray-500 shrink-0" />
                                    )}
                                  </span>
                                </td>
                                <td className="px-2 py-3 text-center font-mono text-gray-500">
                                  {param.weight > 0 ? param.weight : "—"}
                                </td>
                                <td className="px-4 py-3 font-mono text-gray-300">{param.benchmark}</td>
                                <td className="px-4 py-3 font-mono text-gray-200">{param.actual}</td>
                                <td className="px-4 py-3 text-center">
                                  <VerdictPill verdict={param.verdict} />
                                </td>
                              </tr>

                              {isOpen && (
                                <tr className="bg-gray-950/80">
                                  <td colSpan={6} className="px-4 sm:px-6 py-4">
                                    <div className="space-y-3 max-w-4xl">
                                      <div className="space-y-1">
                                        <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                                          Why this parameter matters
                                        </span>
                                        <p className="text-[11px] text-gray-300 leading-relaxed font-normal">
                                          {param.whyItMatters}
                                        </p>
                                      </div>

                                      <div className="space-y-1">
                                        <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">
                                          What this value means for {data.company.name}
                                        </span>
                                        <p className="text-[11px] text-gray-300 leading-relaxed font-normal">
                                          {param.interpretation}
                                        </p>
                                      </div>

                                      <div className="flex flex-wrap gap-2 pt-1">
                                        <span className="px-2 py-1 rounded-lg bg-gray-900 border border-gray-800 text-[10px] text-gray-400 font-medium">
                                          Category: {param.category}
                                        </span>
                                        <span className="px-2 py-1 rounded-lg bg-gray-900 border border-gray-800 text-[10px] text-gray-400 font-medium">
                                          Source: {param.source}
                                        </span>
                                        <span className="px-2 py-1 rounded-lg bg-gray-900 border border-gray-800 text-[10px] text-gray-400 font-medium">
                                          {param.dataQuality}
                                        </span>
                                        <span className="px-2 py-1 rounded-lg bg-gray-900 border border-gray-800 text-[10px] text-gray-400 font-medium">
                                          {param.weight > 0
                                            ? `Weight ${param.weight} of ${data.metrics.weightTotal}`
                                            : "Not scored — context only"}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {data.metrics.verdictCounts.notAssessed > 0 && (
                    <div className="bg-gray-800/30 border border-gray-700/60 rounded-xl p-3.5 text-[11px] text-gray-300 leading-relaxed flex items-start gap-2.5">
                      <IconInfo size={15} className="text-gray-400 shrink-0 mt-0.5" />
                      <span>
                        <span className="font-bold text-gray-200">
                          {data.metrics.verdictCounts.notAssessed} parameter
                          {data.metrics.verdictCounts.notAssessed > 1 ? "s could" : " could"} not be assessed
                        </span>{" "}
                        because the source does not publish the data. These are excluded from the score rather than
                        counted as a pass — data coverage is {data.metrics.coveragePct}%, giving{" "}
                        {data.metrics.confidence.toLowerCase()} confidence. Treat each as an open question to check in
                        the RHP.
                      </span>
                    </div>
                  )}
                </div>
              </FadeIn>

              <FadeIn delay={0.11}>
                <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 sm:p-7 space-y-5 shadow-xl">
                  <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-black font-extrabold flex items-center justify-center text-sm shadow-md shadow-emerald-500/30">
                      5
                    </div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-emerald-400 tracking-wide uppercase">
                      GREEN, NEUTRAL &amp; RED FLAGS
                    </h2>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed">
                    Three buckets, not two. Facts that are genuinely favourable go left, genuine concerns go right, and
                    anything that is neither — an Offer-for-Sale component, a high-but-falling ratio, data the source
                    does not publish — sits in the middle rather than being forced into a colour it does not deserve.
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-emerald-500/30 pb-3">
                        <div className="flex items-center gap-2">
                          <IconCheckCircle size={18} className="text-emerald-400" />
                          <h3 className="text-sm font-extrabold text-emerald-400 uppercase tracking-wider">
                            Green Flags
                          </h3>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {data.company.flags.green.length}
                        </span>
                      </div>
                      {data.company.flags.green.length > 0 ? (
                        <ul className="space-y-2.5 text-xs text-gray-200">
                          {data.company.flags.green.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <IconCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                              <span>
                                {item.label}
                                {item.detail && (
                                  <span className="block text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                                    {item.detail}
                                  </span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-500 italic">
                          No unambiguously favourable signals found in the published data.
                        </p>
                      )}
                    </div>

                    <div className="bg-gray-800/25 border border-gray-600/40 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-gray-600/40 pb-3">
                        <div className="flex items-center gap-2">
                          <IconInfo size={18} className="text-gray-300" />
                          <h3 className="text-sm font-extrabold text-gray-300 uppercase tracking-wider">
                            Neutral / Watch
                          </h3>
                        </div>
                        <span className="text-xs font-mono font-bold text-gray-300">
                          {data.company.flags.neutral.length}
                        </span>
                      </div>
                      {data.company.flags.neutral.length > 0 ? (
                        <ul className="space-y-2.5 text-xs text-gray-200">
                          {data.company.flags.neutral.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-gray-400 font-bold shrink-0">~</span>
                              <span>
                                {item.label}
                                {item.detail && (
                                  <span className="block text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                                    {item.detail}
                                  </span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-500 italic">Nothing sitting in between.</p>
                      )}
                    </div>

                    <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-red-500/30 pb-3">
                        <div className="flex items-center gap-2">
                          <IconError size={18} className="text-red-400" />
                          <h3 className="text-sm font-extrabold text-red-400 uppercase tracking-wider">Red Flags</h3>
                        </div>
                        <span className="text-xs font-mono font-bold text-red-400">
                          {data.company.flags.red.length}
                        </span>
                      </div>
                      {data.company.flags.red.length > 0 ? (
                        <ul className="space-y-2.5 text-xs text-gray-200">
                          {data.company.flags.red.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-red-400 font-bold shrink-0">✕</span>
                              <span>
                                {item.label}
                                {item.detail && (
                                  <span className="block text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                                    {item.detail}
                                  </span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-500 italic">
                          No red flags identified in the published data. This is not a clean bill of health — see the
                          Neutral column and the unassessed parameters above.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.12}>
                <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 sm:p-7 space-y-5 shadow-xl">
                  <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-black font-extrabold flex items-center justify-center text-sm shadow-md shadow-emerald-500/30">
                        6
                      </div>
                      <div className="flex items-center gap-2">
                        <IconWarning size={20} className="text-amber-400" />
                        <h2 className="text-lg sm:text-xl font-extrabold text-emerald-400 tracking-wide uppercase">
                          RISK FACTOR ANALYSIS
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-300">
                      <span>Overall Risk Rating:</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 font-extrabold">
                        {data.company.riskFactorAnalysis.overallRating}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {data.company.riskFactorAnalysis.risks.map((r) => {
                      const isHigh = r.severity === "High Risk";
                      const isLow = r.severity === "Low Risk";
                      return (
                        <div
                          key={r.id}
                          className="bg-gray-950 border border-gray-800/90 rounded-2xl p-4 space-y-2 hover:border-gray-700 transition-all"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-white">
                              {r.title}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold border shrink-0 ${
                                isHigh
                                  ? "bg-red-500/20 text-red-400 border-red-500/40"
                                  : isLow
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                  : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                              }`}
                            >
                              {r.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                            {r.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.14}>
                <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 sm:p-7 space-y-6 shadow-xl">
                  <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-black font-extrabold flex items-center justify-center text-sm shadow-md shadow-emerald-500/30">
                      7
                    </div>
                    <div className="flex items-center gap-2">
                      <IconBookmark size={20} className="text-emerald-400" />
                      <h2 className="text-lg sm:text-xl font-extrabold text-emerald-400 tracking-wide uppercase">
                        FINAL OBSERVATIONS
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <IconCheckCircle size={16} className="text-emerald-400" />
                      <span>Positives</span>
                    </h3>
                    <ul className="space-y-2 text-xs text-gray-200 font-medium">
                      {data.company.finalObservations.positives.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <IconCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {data.company.finalObservations.watchItems.length > 0 && (
                    <div className="space-y-2.5 pt-3 border-t border-gray-800">
                      <h3 className="text-xs font-extrabold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                        <IconInfo size={16} className="text-gray-300" />
                        <span>Watch Items — neither good nor bad</span>
                      </h3>
                      <ul className="space-y-2 text-xs text-gray-200 font-medium">
                        {data.company.finalObservations.watchItems.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-gray-400 font-bold shrink-0">~</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-2.5 pt-3 border-t border-gray-800">
                    <h3 className="text-xs font-extrabold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                      <IconError size={16} className="text-red-400" />
                      <span>Concerns</span>
                    </h3>
                    {data.company.finalObservations.concerns.length > 0 ? (
                      <ul className="space-y-2 text-xs text-gray-200 font-medium">
                        {data.company.finalObservations.concerns.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-red-400 font-bold shrink-0">✕</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500 italic">
                        No outright concerns in the published data — read the Watch Items and the Risk Factors above
                        before concluding there are none.
                      </p>
                    )}
                  </div>

                  <div className="bg-[#1e232e] border border-gray-700/80 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between flex-wrap gap-3 border-b border-gray-700/80 pb-3">
                      <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <IconLightbulb size={16} className="text-amber-400" />
                        <span>Summary & Closing Framework Rating</span>
                      </h4>

                      <div className="px-3.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-extrabold text-xs border border-amber-500/40 flex items-center gap-1.5">
                        <span>Rating:</span>
                        <span className="text-amber-400 font-mono text-sm">
                          {data.company.finalObservations.closingRating}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed font-medium italic">
                      &quot;{data.company.finalObservations.closingSummary}&quot;
                    </p>
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.16}>
                <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 sm:p-7 space-y-6 shadow-xl">
                  <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-black font-extrabold flex items-center justify-center text-sm shadow-md shadow-emerald-500/30">
                      8
                    </div>
                    <div className="flex items-center gap-2">
                      <IconTarget size={20} className="text-emerald-400" />
                      <h2 className="text-lg sm:text-xl font-extrabold text-emerald-400 tracking-wide uppercase">
                        FINAL DASHBOARD (CONCLUSION PAGE)
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                      Verdict count across all {data.company.finalDashboard.counts.totalParameters} parameters:
                    </span>

                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                      {(
                        [
                          ["Pass", data.company.finalDashboard.counts.greenFlags, "emerald"],
                          ["Caution", data.company.finalDashboard.counts.yellowFlags, "amber"],
                          ["Fail", data.company.finalDashboard.counts.redFlags, "red"],
                          ["Not Assessed", data.company.finalDashboard.counts.notAssessed, "gray"],
                          ["Info", data.company.finalDashboard.counts.informational, "blue"],
                        ] as const
                      ).map(([label, count, tone]) => (
                        <div
                          key={label}
                          className={`rounded-2xl p-4 text-center space-y-1 border ${
                            tone === "emerald"
                              ? "bg-emerald-500/10 border-emerald-500/30"
                              : tone === "amber"
                                ? "bg-amber-500/10 border-amber-500/30"
                                : tone === "red"
                                  ? "bg-red-500/10 border-red-500/30"
                                  : tone === "blue"
                                    ? "bg-blue-500/10 border-blue-500/30"
                                    : "bg-gray-700/25 border-gray-600/40"
                          }`}
                        >
                          <span
                            className={`text-3xl font-extrabold font-mono block ${
                              tone === "emerald"
                                ? "text-emerald-400"
                                : tone === "amber"
                                  ? "text-amber-400"
                                  : tone === "red"
                                    ? "text-red-400"
                                    : tone === "blue"
                                      ? "text-blue-300"
                                      : "text-gray-300"
                            }`}
                          >
                            {count}
                          </span>
                          <span className="text-[11px] font-bold text-gray-300 block">{label}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      These are the verdicts from the {data.company.finalDashboard.counts.totalParameters}-parameter
                      table in section 4 — the five numbers add up to {data.company.finalDashboard.counts.totalParameters}
                      , so the dashboard can never disagree with the table it summarises. Only Pass, Caution and Fail
                      feed the score.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      FINAL DASHBOARD CATEGORY SUMMARY
                    </h3>

                    <div className="overflow-x-auto rounded-2xl border border-gray-800">
                      <table className="w-full text-xs">
                        <thead className="bg-emerald-500/10 border-b border-gray-800 text-emerald-400 uppercase font-bold">
                          <tr>
                            <th scope="col" className="text-left px-5 py-3.5">CATEGORY</th>
                            <th scope="col" className="text-left px-5 py-3.5">DRIVEN BY</th>
                            <th scope="col" className="text-right px-5 py-3.5 w-48">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/80 text-gray-200 font-medium">
                          {data.company.finalDashboard.categorySummary.map((item, idx) => {
                            const tone =
                              item.type === "strong"
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                : item.type === "weak"
                                  ? "bg-red-500/20 text-red-400 border-red-500/40"
                                  : item.type === "unknown"
                                    ? "bg-gray-700/40 text-gray-300 border-gray-600/50"
                                    : "bg-amber-500/20 text-amber-400 border-amber-500/40";
                            const dot =
                              item.type === "strong"
                                ? "bg-emerald-400"
                                : item.type === "weak"
                                  ? "bg-red-400"
                                  : item.type === "unknown"
                                    ? "bg-gray-400"
                                    : "bg-amber-400";

                            return (
                              <tr key={idx} className="hover:bg-gray-950/60 transition-colors">
                                <td className="px-5 py-3.5 font-bold text-white">{item.category}</td>
                                <td className="px-5 py-3.5 text-[11px] text-gray-500 font-normal">
                                  {item.driver || "—"}
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${tone}`}
                                  >
                                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                                    {item.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      Each row takes its colour from the verdict of the parameter named in &quot;Driven by&quot;, so this
                      summary cannot contradict the framework table.
                    </p>
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.18}>
                <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 sm:p-7 space-y-6 shadow-xl">
                  <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-black font-extrabold flex items-center justify-center text-sm shadow-md shadow-emerald-500/30">
                      9
                    </div>
                    <div className="flex items-center gap-2">
                      <IconLightbulb size={20} className="text-emerald-400" />
                      <h2 className="text-lg sm:text-xl font-extrabold text-emerald-400 tracking-wide uppercase">
                        HOW TO READ THESE RESULTS
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                      How the score is calculated
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(
                        [
                          ["Score", `${data.metrics.aiScore}/100`, "text-emerald-400"],
                          ["Weight earned", `${data.metrics.weightEarned} / ${data.metrics.weightTotal}`, "text-cyan-400"],
                          ["Data coverage", `${data.metrics.coveragePct}%`, "text-amber-400"],
                          ["Confidence", data.metrics.confidence, "text-gray-200"],
                        ] as const
                      ).map(([label, value, color]) => (
                        <div key={label} className="bg-gray-950 border border-gray-800 rounded-xl p-3.5 text-center">
                          <span className="text-[10px] text-gray-500 font-bold uppercase block">{label}</span>
                          <span className={`text-base font-extrabold font-mono ${color}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                    <ul className="space-y-2">
                      {data.resultGuide.howScoreWorks.map((line, i) => (
                        <li key={i} className="text-xs text-gray-300 leading-relaxed flex items-start gap-2">
                          <span className="text-emerald-500 shrink-0">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-gray-800">
                    <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                      What each verdict means
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {data.resultGuide.verdictLegend.map((v) => (
                        <div
                          key={v.verdict}
                          className="bg-gray-950 border border-gray-800 rounded-xl p-3 flex items-start gap-2.5"
                        >
                          <VerdictPill verdict={v.verdict as Verdict} />
                          <span className="text-[11px] text-gray-400 leading-relaxed">{v.meaning}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-gray-800">
                    <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                      What the rating means
                    </h3>
                    <div className="overflow-x-auto rounded-2xl border border-gray-800">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-950 border-b border-gray-800 text-gray-400 uppercase font-semibold">
                          <tr>
                            <th scope="col" className="text-left px-4 py-3">RATING</th>
                            <th scope="col" className="text-left px-4 py-3 w-24">SCORE</th>
                            <th scope="col" className="text-left px-4 py-3">MEANING</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-gray-300">
                          {data.resultGuide.ratingScale.map((r) => {
                            const isThis = r.rating === data.metrics.rating;
                            return (
                              <tr
                                key={r.rating}
                                className={isThis ? "bg-emerald-500/10" : "hover:bg-gray-950/60 transition-colors"}
                              >
                                <td
                                  className={`px-4 py-3 font-extrabold whitespace-nowrap ${
                                    isThis ? "text-emerald-400" : "text-gray-200"
                                  }`}
                                >
                                  {r.rating}
                                  {isThis && (
                                    <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 text-[9px] font-extrabold align-middle">
                                      THIS IPO
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 font-mono text-gray-400">{r.band}</td>
                                <td className="px-4 py-3 font-normal leading-relaxed">{r.meaning}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-gray-950 border border-gray-800 rounded-xl p-3.5 text-[11px] text-gray-300 leading-relaxed">
                      {data.resultGuide.ratingAdjustment.explanation}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-gray-800">
                    <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                      How the weight is distributed
                    </h3>
                    <div className="space-y-2.5">
                      {data.resultGuide.weightByCategory.map((w) => (
                        <div key={w.category} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] gap-2">
                            <span className="font-bold text-gray-300">{w.category}</span>
                            <span className="font-mono text-gray-500 shrink-0">
                              {w.weight} of {w.designedWeight} pts · {w.sharePct}% of score
                              {w.unassessedWeight > 0 && (
                                <span className="text-amber-400/80"> · {w.unassessedWeight} unassessed</span>
                              )}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden flex">
                            <div className="h-full bg-emerald-500/70" style={{ width: `${w.sharePct}%` }} />
                            {w.unassessedWeight > 0 && (
                              <div
                                className="h-full bg-amber-500/40"
                                style={{
                                  width: `${(w.unassessedWeight / (data.metrics.weightTotal || 1)) * 100}%`,
                                }}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      Green is weight that was actually scored and sums to {data.metrics.weightTotal} points. Amber is
                      weight this issue could not be scored on because the source does not publish the data — it counts
                      neither for nor against the score, which is why data coverage is reported alongside it.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-gray-800">
                    <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                      Where the data comes from
                    </h3>
                    <ul className="space-y-2">
                      {data.resultGuide.dataSources.map((s, i) => (
                        <li key={i} className="text-[11px] text-gray-400 leading-relaxed flex items-start gap-2">
                          <IconCheck size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-gray-800">
                    <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <IconWarning size={15} className="text-amber-400" />
                      <span>What this analysis cannot tell you</span>
                    </h3>
                    <ul className="space-y-2">
                      {data.resultGuide.limitations.map((l, i) => (
                        <li key={i} className="text-[11px] text-gray-400 leading-relaxed flex items-start gap-2">
                          <span className="text-amber-500/70 shrink-0">•</span>
                          <span>{l}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[10px] text-gray-500 italic leading-relaxed pt-1">
                      This page is a rules-based reading of publicly published IPO data, generated for information only.
                      It is not investment advice and not a recommendation to buy or sell any security. Verify every
                      figure against the RHP and consult a SEBI-registered adviser before investing.
                    </p>
                  </div>
                </div>
              </FadeIn>
            </>
          )}
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </ProtectedRoute>
  );
}

function IconBarChartIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-purple-400 shrink-0" aria-hidden="true">
      <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 16v-4M12 16V8m5 8v-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
