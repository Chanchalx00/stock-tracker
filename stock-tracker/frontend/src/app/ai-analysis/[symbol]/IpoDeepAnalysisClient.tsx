"use client";

import { useEffect, useState, useCallback } from "react";
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
  IconSun,
  IconWind,
  IconLayers,
  IconZap,
  IconWrench,
  IconSliders,
  IconCheck,
  IconBuilding,
  IconGlobe,
  IconUsers,
  IconAward,
  IconTarget,
  IconShield,
  IconCheckCircle,
  IconRefresh,
  IconTrendingUp,
  IconBookmark,
  IconError,
  IconWarning,
  IconBattery,
  IconLightbulb,
} from "@/lib/icons";

import { useToast } from "@/hooks/useToast";
import api from "@/lib/api";

export interface DeepIpoData {
  company: {
    name: string;
    symbol: string;
    about: string;
    portfolio: { name: string; icon: string }[];
    capabilities: string[];
    highlights: { capacity: string; ranking: string };
    customers: string[];
    presence: { capacityText: string; states: string[] };
    discoms: string[];
    showcase: { title: string; description: string; imageUrl: string }[];
    advantages: string[];
    details: {
      issueType: string;
      totalIssueSize: string;
      freshIssue: string;
      ofs: string;
      priceBand: string;
      faceValue: string;
      lotSize: string;
      listing: string;
      marketCap?: string;
      registrar?: string;
      leadManagers?: string;
      prePromoterHolding?: string;
      postPromoterHolding?: string;
    };
    dates?: {
      openDate: string;
      closeDate: string;
      allotmentDate: string;
      refundsDate: string;
      dematCreditDate: string;
      listingDate: string;
    };
    lotBreakup?: {
      category: string;
      lots: string;
      shares: string;
      amount: string;
    }[];
    fundUtilization?: {
      benchmarkText: string;
      cards: { amount: string; title: string; description: string }[];
      financialAssessment: string;
    };
    greenRedFlags?: {
      greenFlags: {
        businessQuality: string[];
        financialPositives: string[];
      };
      redFlags: {
        profitabilityRatios: string[];
        leverageDebt: string[];
        valuation: string[];
        ipoProceeds: string[];
      };
    };
    riskFactorAnalysis?: {
      overallRating: string;
      risks: {
        id: number;
        title: string;
        severity: "High Risk" | "Medium Risk" | "Low Risk";
        description: string;
      }[];
    };
    finalObservations?: {
      positives: string[];
      concerns: string[];
      closingSummary: string;
      closingRating: string;
    };
    finalDashboard?: {
      counts: {
        greenFlags: number;
        yellowFlags: number;
        redFlags: number;
      };
      categorySummary: {
        category: string;
        status: string;
        type: "strong" | "positive" | "mixed" | "weak";
      }[];
    };
  };
  metrics: {
    currentPrice: number;
    percentChange: number;
    gmpAmount: number;
    gmpPercent: number;
    aiScore: number;
    rating: string;
    passedCount: number;
  };
  parameters20: {
    id: number;
    name: string;
    benchmark: string;
    actual: string;
    verdict: "Pass" | "Caution" | "Fail";
  }[];
}

export default function IpoDeepAnalysisClient() {
  const params = useParams();
  const rawSym = params?.symbol ? (params.symbol as string) : "JUNIPER";
  const { toast, error: toastError } = useToast();

  const [data, setData] = useState<DeepIpoData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDeepAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/analysis/ipo/deep/${encodeURIComponent(rawSym)}`);
      setData(res.data.data);
    } catch {
      toastError(`Could not load deep IPO analysis for ${rawSym}`);
    } finally {
      setLoading(false);
    }
  }, [rawSym, toastError]);

  useEffect(() => {
    loadDeepAnalysis();
  }, [loadDeepAnalysis]);

  const renderPortfolioIcon = (iconName: string) => {
    switch (iconName) {
      case "Sun":
        return <IconSun size={14} className="text-amber-400 shrink-0" />;
      case "Wind":
        return <IconWind size={14} className="text-cyan-400 shrink-0" />;
      case "Layers":
        return <IconLayers size={14} className="text-purple-400 shrink-0" />;
      case "Battery":
        return <IconBattery size={14} className="text-emerald-400 shrink-0" />;
      case "Zap":
        return <IconZap size={14} className="text-emerald-400 shrink-0" />;
      case "Wrench":
        return <IconWrench size={14} className="text-blue-400 shrink-0" />;
      default:
        return <IconSliders size={14} className="text-amber-400 shrink-0" />;
    }
  };

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

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<IconRefresh size={12} />}
              onClick={loadDeepAnalysis}
              loading={loading}
            >
              Refresh Real-time Metrics
            </Button>
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
                  </div>

                  <div className="flex items-center gap-3 bg-gray-950 border border-gray-800 p-3 rounded-xl">
                    <StockAvatar symbol={data.company.symbol} size={40} />
                    <div>
                      <span className="font-extrabold text-white text-sm block">
                        {data.company.name}
                      </span>
                      <span className="text-xs text-emerald-400 font-mono font-bold">
                        {data.metrics.passedCount}/20 PASSED · {data.metrics.rating}
                      </span>
                    </div>
                  </div>
                </div>
              </FadeIn>

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
                      {data.company.about.split("\n\n").map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Products & Services Portfolio:
                    </h4>
                    <div className="flex flex-wrap gap-2.5">
                      {data.company.portfolio.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-gray-200 font-medium"
                        >
                          {renderPortfolioIcon(item.icon)}
                          <span>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Integrated Business Capabilities:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {data.company.capabilities.map((cap, idx) => (
                        <span
                          key={idx}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/25"
                        >
                          <IconCheckCircle size={13} className="text-cyan-400" />
                          <span>{cap}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-emerald-500/10 border-l-4 border-l-emerald-500 border-y border-r border-gray-800 rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-4 text-emerald-400 font-bold">
                    <div className="flex items-center gap-2">
                      <IconTrendingUp size={18} />
                      <span className="text-lg font-mono tracking-tight">{data.company.highlights.capacity}</span>
                    </div>
                    <div className="text-xs uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-500/30">
                      {data.company.highlights.ranking}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                        <IconUsers size={16} className="text-cyan-400" />
                        <span>Major Customers</span>
                      </h4>
                      <ul className="space-y-2 text-xs text-gray-300">
                        {data.company.customers.map((cust, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-cyan-400 font-bold">•</span>
                            <span>{cust}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                        <IconGlobe size={16} className="text-emerald-400" />
                        <span>Project Presence & Capacity</span>
                      </h4>
                      <div>
                        <span className="text-lg font-bold text-emerald-400 font-mono block">
                          {data.company.presence.capacityText}
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {data.company.presence.states.map((st, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[10px] bg-gray-900 text-gray-300 border border-gray-800 font-medium"
                            >
                              📍 {st}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                        <IconAward size={16} className="text-amber-400" />
                        <span>Key Utilities & DISCOMs</span>
                      </h4>
                      <ul className="space-y-2 text-xs text-gray-300 font-medium">
                        {data.company.discoms.map((disc, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{disc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <IconLayers size={16} className="text-emerald-400" />
                      <span>Renewable Energy Infrastructure & Project Showcase</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.company.showcase.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden group hover:border-gray-700 transition-all"
                        >
                          <div className="h-48 w-full relative overflow-hidden bg-gray-950">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.imageUrl || "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80"}
                              alt={item.title}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80";
                              }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />
                          </div>
                          <div className="p-4 space-y-1.5">
                            <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                              <IconSun size={14} className="text-amber-400 shrink-0" />
                              <span>{item.title}</span>
                            </h5>
                            <p className="text-xs text-gray-400 leading-relaxed font-medium">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-gray-800">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <IconShield size={16} className="text-amber-400" />
                      <span>Key Competitive Advantages</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {data.company.advantages.map((adv, idx) => (
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

                  {data.company.dates && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        IPO Important Dates & Event Schedule
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                        <div className="bg-gray-950 border border-gray-800 p-3 rounded-xl text-center">
                          <span className="text-[10px] text-gray-500 font-bold uppercase block">IPO Open</span>
                          <span className="text-xs font-extrabold text-emerald-400 font-mono">{data.company.dates.openDate}</span>
                        </div>
                        <div className="bg-gray-950 border border-gray-800 p-3 rounded-xl text-center">
                          <span className="text-[10px] text-gray-500 font-bold uppercase block">IPO Close</span>
                          <span className="text-xs font-extrabold text-red-400 font-mono">{data.company.dates.closeDate}</span>
                        </div>
                        <div className="bg-gray-950 border border-gray-800 p-3 rounded-xl text-center">
                          <span className="text-[10px] text-gray-500 font-bold uppercase block">Allotment</span>
                          <span className="text-xs font-extrabold text-amber-400 font-mono">{data.company.dates.allotmentDate}</span>
                        </div>
                        <div className="bg-gray-950 border border-gray-800 p-3 rounded-xl text-center">
                          <span className="text-[10px] text-gray-500 font-bold uppercase block">Refunds</span>
                          <span className="text-xs font-extrabold text-cyan-400 font-mono">{data.company.dates.refundsDate}</span>
                        </div>
                        <div className="bg-gray-950 border border-gray-800 p-3 rounded-xl text-center">
                          <span className="text-[10px] text-gray-500 font-bold uppercase block">Demat Credit</span>
                          <span className="text-xs font-extrabold text-purple-400 font-mono">{data.company.dates.dematCreditDate}</span>
                        </div>
                        <div className="bg-gray-950 border border-gray-800 p-3 rounded-xl text-center">
                          <span className="text-[10px] text-gray-500 font-bold uppercase block">Listing Date</span>
                          <span className="text-xs font-extrabold text-emerald-300 font-mono">{data.company.dates.listingDate}</span>
                        </div>
                      </div>
                    </div>
                  )}

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
                        <tr className="hover:bg-gray-950/60 transition-colors">
                          <td className="px-5 py-3.5 text-gray-400 font-bold">Issue Type</td>
                          <td className="px-5 py-3.5 text-white font-mono">{data.company.details.issueType}</td>
                        </tr>
                        <tr className="hover:bg-gray-950/60 transition-colors">
                          <td className="px-5 py-3.5 text-gray-400 font-bold">Total Issue Size</td>
                          <td className="px-5 py-3.5 text-white font-mono font-bold">{data.company.details.totalIssueSize}</td>
                        </tr>
                        <tr className="hover:bg-gray-950/60 transition-colors">
                          <td className="px-5 py-3.5 text-gray-400 font-bold">Fresh Issue</td>
                          <td className="px-5 py-3.5 text-emerald-400 font-mono font-bold">{data.company.details.freshIssue}</td>
                        </tr>
                        <tr className="hover:bg-gray-950/60 transition-colors">
                          <td className="px-5 py-3.5 text-gray-400 font-bold">Offer For Sale (OFS)</td>
                          <td className="px-5 py-3.5 text-cyan-400 font-mono font-bold">{data.company.details.ofs}</td>
                        </tr>
                        <tr className="hover:bg-gray-950/60 transition-colors">
                          <td className="px-5 py-3.5 text-gray-400 font-bold">Price Band</td>
                          <td className="px-5 py-3.5 text-amber-400 font-mono font-bold">{data.company.details.priceBand}</td>
                        </tr>
                        <tr className="hover:bg-gray-950/60 transition-colors">
                          <td className="px-5 py-3.5 text-gray-400 font-bold">Face Value</td>
                          <td className="px-5 py-3.5 text-white font-mono">{data.company.details.faceValue}</td>
                        </tr>
                        <tr className="hover:bg-gray-950/60 transition-colors">
                          <td className="px-5 py-3.5 text-gray-400 font-bold">Lot Size</td>
                          <td className="px-5 py-3.5 text-white font-mono">{data.company.details.lotSize}</td>
                        </tr>
                        <tr className="hover:bg-gray-950/60 transition-colors">
                          <td className="px-5 py-3.5 text-gray-400 font-bold">Listing Exchanges</td>
                          <td className="px-5 py-3.5 text-emerald-400 font-bold">{data.company.details.listing}</td>
                        </tr>
                        {data.company.details.marketCap && (
                          <tr className="hover:bg-gray-950/60 transition-colors">
                            <td className="px-5 py-3.5 text-gray-400 font-bold">Market Cap (Post IPO)</td>
                            <td className="px-5 py-3.5 text-emerald-400 font-mono font-extrabold">{data.company.details.marketCap}</td>
                          </tr>
                        )}
                        {data.company.details.prePromoterHolding && (
                          <tr className="hover:bg-gray-950/60 transition-colors">
                            <td className="px-5 py-3.5 text-gray-400 font-bold">Promoter Shareholding Pre-Issue</td>
                            <td className="px-5 py-3.5 text-amber-400 font-mono font-extrabold">{data.company.details.prePromoterHolding}</td>
                          </tr>
                        )}
                        {data.company.details.postPromoterHolding && (
                          <tr className="hover:bg-gray-950/60 transition-colors">
                            <td className="px-5 py-3.5 text-gray-400 font-bold">Promoter Shareholding Post-Issue</td>
                            <td className="px-5 py-3.5 text-emerald-400 font-mono font-extrabold">{data.company.details.postPromoterHolding}</td>
                          </tr>
                        )}
                        {data.company.details.registrar && (
                          <tr className="hover:bg-gray-950/60 transition-colors">
                            <td className="px-5 py-3.5 text-gray-400 font-bold">Registrar</td>
                            <td className="px-5 py-3.5 text-white font-medium">{data.company.details.registrar}</td>
                          </tr>
                        )}
                        {data.company.details.leadManagers && (
                          <tr className="hover:bg-gray-950/60 transition-colors">
                            <td className="px-5 py-3.5 text-gray-400 font-bold">Lead Managers</td>
                            <td className="px-5 py-3.5 text-gray-300 font-medium">{data.company.details.leadManagers}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {data.company.lotBreakup && (
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
                </div>
              </FadeIn>

              {data.company.fundUtilization && (
                <FadeIn delay={0.09}>
                  <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 sm:p-7 space-y-5 shadow-xl">
                    <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-black font-extrabold flex items-center justify-center text-sm shadow-md shadow-emerald-500/30">
                        3
                      </div>
                      <h2 className="text-lg sm:text-xl font-extrabold text-emerald-400 tracking-wide uppercase">
                        FUND UTILIZATION
                      </h2>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300 font-medium flex items-center gap-2">
                      <IconWarning size={16} className="text-amber-400 shrink-0" />
                      <span>{data.company.fundUtilization.benchmarkText}</span>
                    </div>

                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Objects of the Issue (Actual Allocation)
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {data.company.fundUtilization.cards.map((card, idx) => (
                        <div
                          key={idx}
                          className="bg-[#0f172a] border border-blue-900/50 rounded-2xl p-5 space-y-2 hover:border-blue-700/60 transition-all shadow-lg"
                        >
                          <span className="text-2xl font-extrabold text-amber-400 font-mono block">
                            {card.amount}
                          </span>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            {card.title}
                          </h4>
                          <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                            {card.description}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-xs text-gray-300 leading-relaxed font-medium flex items-start gap-2.5">
                      <IconWarning size={16} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-400">Financial Assessment: </span>
                        <span>{data.company.fundUtilization.financialAssessment}</span>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              )}

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
                          20-POINT IPO FRAMEWORK
                        </h2>
                      </div>
                    </div>

                    <span className="px-3.5 py-1.5 rounded-2xl bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40 text-xs">
                      {data.metrics.passedCount} / {data.parameters20.length} PASSED
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-gray-800">
                    <table className="w-full text-xs">
                      <thead className="bg-emerald-500/10 border-b border-gray-800 text-emerald-400 uppercase font-bold">
                        <tr>
                          <th scope="col" className="text-left px-4 py-3.5 w-12">NO.</th>
                          <th scope="col" className="text-left px-4 py-3.5">PARAMETER</th>
                          <th scope="col" className="text-left px-4 py-3.5">BENCHMARK</th>
                          <th scope="col" className="text-left px-4 py-3.5">ACTUAL</th>
                          <th scope="col" className="text-center px-4 py-3.5 w-28">VERDICT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/80 font-medium">
                        {data.parameters20.map((param) => {
                          const isPass = param.verdict === "Pass";
                          const isCaution = param.verdict === "Caution";

                          return (
                            <tr
                              key={param.id}
                              className={`transition-colors ${
                                isPass
                                  ? "hover:bg-emerald-950/20"
                                  : isCaution
                                  ? "bg-amber-500/5 hover:bg-amber-500/10"
                                  : "bg-red-500/5 hover:bg-red-500/10"
                              }`}
                            >
                              <td className="px-4 py-3 font-mono font-bold text-gray-400 text-center">
                                {param.id}
                              </td>
                              <td className="px-4 py-3 font-bold text-white whitespace-nowrap">
                                {param.name}
                              </td>
                              <td className="px-4 py-3 font-mono text-gray-300 whitespace-nowrap">
                                {param.benchmark}
                              </td>
                              <td className="px-4 py-3 font-mono text-gray-200">
                                {param.actual}
                              </td>
                              <td className="px-4 py-3 text-center whitespace-nowrap">
                                {isPass ? (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    Pass
                                  </span>
                                ) : isCaution ? (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                                    Caution
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-red-500/20 text-red-400 border border-red-500/40">
                                    <span className="w-2 h-2 rounded-full bg-red-400" />
                                    Fail
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </FadeIn>

              {data.company.greenRedFlags && (
                <FadeIn delay={0.11}>
                  <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 sm:p-7 space-y-5 shadow-xl">
                    <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-black font-extrabold flex items-center justify-center text-sm shadow-md shadow-emerald-500/30">
                        5
                      </div>
                      <h2 className="text-lg sm:text-xl font-extrabold text-emerald-400 tracking-wide uppercase">
                        GREEN FLAGS & RED FLAGS ANALYSIS
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2 border-b border-emerald-500/30 pb-3">
                          <IconCheckCircle size={18} className="text-emerald-400" />
                          <h3 className="text-sm font-extrabold text-emerald-400 uppercase tracking-wider">
                            GREEN FLAGS ✅
                          </h3>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            BUSINESS QUALITY
                          </span>
                          <ul className="space-y-2 text-xs text-gray-200">
                            {data.company.greenRedFlags.greenFlags.businessQuality.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <IconCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-emerald-500/20">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            FINANCIAL POSITIVES
                          </span>
                          <ul className="space-y-2 text-xs text-gray-200">
                            {data.company.greenRedFlags.greenFlags.financialPositives.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <IconCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2 border-b border-red-500/30 pb-3">
                          <IconError size={18} className="text-red-400" />
                          <h3 className="text-sm font-extrabold text-red-400 uppercase tracking-wider">
                            RED FLAGS ❌
                          </h3>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            PROFITABILITY & RETURN RATIOS
                          </span>
                          <ul className="space-y-2 text-xs text-gray-200">
                            {data.company.greenRedFlags.redFlags.profitabilityRatios.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-red-400 font-bold shrink-0">✕</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-red-500/20">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            LEVERAGE & DEBT
                          </span>
                          <ul className="space-y-2 text-xs text-gray-200">
                            {data.company.greenRedFlags.redFlags.leverageDebt.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-red-400 font-bold shrink-0">✕</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-red-500/20">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            VALUATION
                          </span>
                          <ul className="space-y-2 text-xs text-gray-200">
                            {data.company.greenRedFlags.redFlags.valuation.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-red-400 font-bold shrink-0">✕</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-red-500/20">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            IPO PROCEEDS
                          </span>
                          <ul className="space-y-2 text-xs text-gray-200">
                            {data.company.greenRedFlags.redFlags.ipoProceeds.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-red-400 font-bold shrink-0">✕</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              )}

              {data.company.riskFactorAnalysis && (
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
              )}

              {data.company.finalObservations && (
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

                    <div className="space-y-2.5 pt-3 border-t border-gray-800">
                      <h3 className="text-xs font-extrabold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                        <IconError size={16} className="text-red-400" />
                        <span>Concerns</span>
                      </h3>
                      <ul className="space-y-2 text-xs text-gray-200 font-medium">
                        {data.company.finalObservations.concerns.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-red-400 font-bold shrink-0">✕</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
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
                            🟡 {data.company.finalObservations.closingRating}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-300 leading-relaxed font-medium italic">
                        &quot;{data.company.finalObservations.closingSummary}&quot;
                      </p>
                    </div>
                  </div>
                </FadeIn>
              )}

              {data.company.finalDashboard && (
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
                        Summary count of all evaluated parameters:
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center space-y-1">
                          <span className="text-3xl font-extrabold text-emerald-400 font-mono block">
                            {data.company.finalDashboard.counts.greenFlags}
                          </span>
                          <span className="text-xs font-bold text-emerald-300">
                            Green Flags (Passed)
                          </span>
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-center space-y-1">
                          <span className="text-3xl font-extrabold text-amber-400 font-mono block">
                            {data.company.finalDashboard.counts.yellowFlags}
                          </span>
                          <span className="text-xs font-bold text-amber-300">
                            Yellow Flags (Caution)
                          </span>
                        </div>

                        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 text-center space-y-1">
                          <span className="text-3xl font-extrabold text-red-400 font-mono block">
                            {data.company.finalDashboard.counts.redFlags}
                          </span>
                          <span className="text-xs font-bold text-red-300">
                            Red Flags (Concerns)
                          </span>
                        </div>
                      </div>
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
                              <th scope="col" className="text-right px-5 py-3.5 w-48">STATUS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800/80 text-gray-200 font-medium">
                            {data.company.finalDashboard.categorySummary.map((item, idx) => {
                              const isStrong = item.type === "strong" || item.type === "positive";
                              const isWeak = item.type === "weak";

                              return (
                                <tr key={idx} className="hover:bg-gray-950/60 transition-colors">
                                  <td className="px-5 py-3.5 font-bold text-white">
                                    {item.category}
                                  </td>
                                  <td className="px-5 py-3.5 text-right">
                                    {isStrong ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                        {item.status}
                                      </span>
                                    ) : isWeak ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-red-500/20 text-red-400 border border-red-500/40">
                                        <span className="w-2 h-2 rounded-full bg-red-400" />
                                        {item.status}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                                        {item.status}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              )}
            </>
          )}
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </ProtectedRoute>
  );
}
