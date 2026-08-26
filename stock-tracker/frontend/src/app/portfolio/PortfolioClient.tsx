"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";
import FadeIn from "@/components/FadeIn";
import { StaggerContainer, StaggerItem } from "@/components/Stagger";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import StockAvatar from "@/components/StockAvatar";

import {
  IconPortfolio,
  IconAddHolding,
  IconTrash,
  IconTrendingUp,
  IconTrendingDown,
  IconTarget,
  IconLineChart,
  IconPieChart,
} from "@/lib/icons";

import { usePortfolio, Holding } from "@/hooks/usePortfolio";
import { useToast } from "@/hooks/useToast";

const defaultForm = { symbol: "", quantity: "", buyPrice: "", companyName: "" };

const PALETTE = [
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#14B8A6", // Teal
];

interface PortfolioAnalytics {
  totalVal: number;
  profitableCount: number;
  winRatePct: number;
  best: Holding | null;
  worst: Holding | null;
  allocations: (Holding & { weightPct: number; color: string })[];
}

export default function PortfolioClient() {
  const { holdings, summary, loading, add, remove } = usePortfolio();
  const { toast, success, error: toastError } = useToast();
  const [form, setForm] = useState(defaultForm);
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setAdding(true);
    try {
      await add({
        symbol: form.symbol.toUpperCase(),
        quantity: +form.quantity,
        buyPrice: +form.buyPrice,
        companyName: form.companyName,
      });
      setForm(defaultForm);
      success("Holding added to portfolio.");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to add holding.",
      );
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await remove(id);
      success("Holding removed.");
    } catch {
      toastError("Failed to remove holding.");
    }
  };

  const analytics = useMemo<PortfolioAnalytics | null>(() => {
    if (!holdings.length) return null;

    const totalVal = holdings.reduce((sum, h) => {
      const val = h.currentValue ?? (h.buyPrice != null && h.quantity != null ? h.buyPrice * h.quantity : 0);
      return sum + val;
    }, 0);

    const profitable = holdings.filter((h) => (h.pnl ?? 0) >= 0);
    const winRatePct = (profitable.length / holdings.length) * 100;

    let best: Holding | null = null;
    let worst: Holding | null = null;

    holdings.forEach((h) => {
      if (h.pnlPercent != null) {
        if (!best || (h.pnlPercent > (best.pnlPercent ?? -Infinity))) best = h;
        if (!worst || (h.pnlPercent < (worst.pnlPercent ?? Infinity))) worst = h;
      }
    });

    const itemsWithWeight = holdings.map((h, i) => {
      const val = h.currentValue ?? (h.buyPrice != null && h.quantity != null ? h.buyPrice * h.quantity : 0);
      const weight = totalVal > 0 ? (val / totalVal) * 100 : 0;
      return {
        ...h,
        weightPct: weight,
        color: PALETTE[i % PALETTE.length],
      };
    }).sort((a, b) => b.weightPct - a.weightPct);

    return {
      totalVal,
      profitableCount: profitable.length,
      winRatePct,
      best,
      worst,
      allocations: itemsWithWeight,
    };
  }, [holdings]);

  const summaryCards = summary
    ? [
        {
          label: "Total Invested",
          value:
            summary.totalInvested != null
              ? `₹${summary.totalInvested.toLocaleString()}`
              : "—",
          positive: null,
        },
        {
          label: "Current Portfolio Value",
          value:
            summary.totalCurrent != null
              ? `₹${summary.totalCurrent.toLocaleString()}`
              : "—",
          positive: null,
        },
        {
          label: "Total P&L",
          value:
            summary.totalPnl != null
              ? `₹${summary.totalPnl.toLocaleString()}`
              : "—",
          positive: summary.totalPnl != null ? summary.totalPnl >= 0 : null,
        },
        {
          label: "Overall Return",
          value:
            summary.totalPnlPercent != null
              ? `${summary.totalPnlPercent.toFixed(2)}%`
              : "—",
          positive:
            summary.totalPnlPercent != null
              ? summary.totalPnlPercent >= 0
              : null,
        },
      ]
    : [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <FadeIn>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconPortfolio
                  size={22}
                  className="text-emerald-400"
                  aria-hidden="true"
                />
                <h1 className="text-2xl font-bold text-white">Portfolio P&L & Analytics</h1>
              </div>
            </div>
          </FadeIn>

          {summary && (
            <StaggerContainer
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
              aria-label="Portfolio summary"
            >
              {summaryCards.map((item) => (
                <StaggerItem key={item.label}>
                  <Card padding="md">
                    <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                    <p
                      className={`text-lg font-bold font-mono ${
                        item.positive === null
                          ? "text-white"
                          : item.positive
                            ? "text-emerald-400"
                            : "text-red-400"
                      }`}
                    >
                      {item.positive === true && (
                        <IconTrendingUp
                          size={14}
                          className="inline mr-1"
                          aria-hidden="true"
                        />
                      )}
                      {item.positive === false && (
                        <IconTrendingDown
                          size={14}
                          className="inline mr-1"
                          aria-hidden="true"
                        />
                      )}
                      {item.value}
                    </p>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}

          {analytics && holdings.length > 0 && (
            <FadeIn delay={0.05}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <IconPieChart size={16} className="text-emerald-400" />
                      <span>Asset Allocation Distribution</span>
                    </h3>
                    <span className="text-xs text-gray-400 font-mono">
                      {holdings.length} Positions
                    </span>
                  </div>

                  <div className="relative h-3 w-full bg-gray-800 rounded-full overflow-hidden flex mb-4 border border-gray-800">
                    {analytics.allocations.map((item) => (
                      <div
                        key={item._id}
                        style={{
                          width: `${item.weightPct}%`,
                          backgroundColor: item.color,
                        }}
                        className="h-full transition-all duration-300 hover:opacity-80"
                        title={`${item.symbol}: ${item.weightPct.toFixed(1)}%`}
                      />
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {analytics.allocations.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800 text-xs"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-bold text-white">{item.symbol}</span>
                        <span className="text-gray-400 font-mono">
                          {item.weightPct.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col justify-between space-y-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <IconTarget size={16} className="text-emerald-400" />
                    <span>Portfolio Win Rate</span>
                  </h3>

                  <div className="flex items-baseline justify-between border-b border-gray-800 pb-3">
                    <div>
                      <p className="text-2xl font-bold text-emerald-400 font-mono">
                        {analytics.winRatePct.toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {analytics.profitableCount} of {holdings.length} positions in profit
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    {analytics.best && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center gap-2">
                          <IconTrendingUp size={14} className="text-emerald-400" />
                          <span className="text-gray-300 font-medium">Top Performer</span>
                        </div>
                        <span className="font-bold text-emerald-400 font-mono">
                          {analytics.best.symbol} (+{analytics.best.pnlPercent?.toFixed(2)}%)
                        </span>
                      </div>
                    )}

                    {analytics.worst && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-2">
                          <IconTrendingDown size={14} className="text-red-400" />
                          <span className="text-gray-300 font-medium">Underperformer</span>
                        </div>
                        <span className="font-bold text-red-400 font-mono">
                          {analytics.worst.symbol} ({analytics.worst.pnlPercent?.toFixed(2)}%)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </FadeIn>
          )}

          <FadeIn delay={0.08}>
            <Card padding="lg" className="mb-6">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">
                Add Holding
              </h2>

              {formError && (
                <AlertBanner variant="error" className="mb-4">
                  {formError}
                </AlertBanner>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <Input
                  label="Symbol"
                  placeholder="e.g. RELIANCE"
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                  required
                />
                <Input
                  label="Company Name"
                  placeholder="Reliance Industries Ltd."
                  value={form.companyName}
                  onChange={(e) =>
                    setForm({ ...form, companyName: e.target.value })
                  }
                />
                <Input
                  label="Quantity"
                  type="number"
                  placeholder="10"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  required
                  min="1"
                />
                <Input
                  label="Buy Price (₹)"
                  type="number"
                  placeholder="150.00"
                  value={form.buyPrice}
                  onChange={(e) =>
                    setForm({ ...form, buyPrice: e.target.value })
                  }
                  required
                  min="0.01"
                  step="0.01"
                />
              </div>
              <Button
                loading={adding}
                leftIcon={<IconAddHolding size={14} />}
                onClick={handleAdd}
              >
                Add Holding
              </Button>
            </Card>
          </FadeIn>

          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner size="lg" label="Loading portfolio…" />
            </div>
          ) : holdings.length === 0 ? (
            <FadeIn>
              <EmptyState
                Icon={IconPortfolio}
                title="No holdings yet"
                description="Add your first stock above to start tracking performance."
              />
            </FadeIn>
          ) : (
            <FadeIn delay={0.1}>
              <ul role="list" className="lg:hidden space-y-3">
                {holdings.map((h) => {
                  const pos = (h.pnl ?? 0) >= 0;
                  const invested =
                    h.investedValue ??
                    (h.buyPrice != null && h.quantity != null
                      ? h.buyPrice * h.quantity
                      : null);
                  const pnlColorClass =
                    h.pnl != null
                      ? pos
                        ? "text-emerald-400"
                        : "text-red-400"
                      : "text-gray-400";

                  return (
                    <li
                      key={h._id}
                      className="rounded-xl border border-gray-800 bg-gray-900/40 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <StockAvatar symbol={h.symbol} size={32} />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white truncate">{h.symbol}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {h.companyName || "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Link
                            href={`/charts?symbol=${encodeURIComponent(h.symbol)}`}
                            aria-label={`Open chart for ${h.symbol}`}
                            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                          >
                            <IconLineChart size={16} aria-hidden="true" />
                          </Link>
                          <button
                            onClick={() => handleRemove(h._id)}
                            aria-label={`Remove ${h.symbol} from portfolio`}
                            className="p-2 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          >
                            <IconTrash size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-gray-800 pt-3">
                        <span className="text-xs text-gray-500">P&amp;L</span>
                        <span className={`font-mono font-bold ${pnlColorClass}`}>
                          {h.pnl != null
                            ? `${pos ? "+" : ""}₹${h.pnl.toLocaleString()}`
                            : "—"}
                          {h.pnlPercent != null && (
                            <span className="ml-2 text-xs">
                              ({pos ? "+" : ""}
                              {h.pnlPercent.toFixed(2)}%)
                            </span>
                          )}
                        </span>
                      </div>

                      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div className="flex justify-between gap-2">
                          <dt className="text-gray-500">Qty</dt>
                          <dd className="font-mono text-gray-300">{h.quantity}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-gray-500">Buy</dt>
                          <dd className="font-mono text-gray-300">
                            {h.buyPrice != null ? `₹${h.buyPrice.toLocaleString()}` : "—"}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-gray-500">Current</dt>
                          <dd className="font-mono font-semibold text-white">
                            {h.currentPrice != null
                              ? `₹${h.currentPrice.toLocaleString()}`
                              : "—"}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-gray-500">Invested</dt>
                          <dd className="font-mono text-gray-300">
                            {invested != null ? `₹${invested.toLocaleString()}` : "—"}
                          </dd>
                        </div>
                        <div className="col-span-2 flex justify-between gap-2">
                          <dt className="text-gray-500">Current value</dt>
                          <dd className="font-mono font-semibold text-white">
                            {h.currentValue != null
                              ? `₹${h.currentValue.toLocaleString()}`
                              : "—"}
                          </dd>
                        </div>
                      </dl>
                    </li>
                  );
                })}
              </ul>

              <div className="hidden lg:block overflow-x-auto rounded-xl border border-gray-800">
                <table className="min-w-[960px] w-full text-sm">
                  <caption className="sr-only">
                    Your portfolio holdings with quantity, buy price, current
                    value, and profit/loss
                  </caption>
                  <thead className="bg-gray-900">
                    <tr className="text-gray-500 text-xs">
                      {[
                        "Symbol",
                        "Company",
                        "Qty",
                        "Buy Price",
                        "Current Price",
                        "Invested Value",
                        "Current Value",
                        "P&L",
                        "Return",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="text-left px-4 py-3.5 font-semibold whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((h) => {
                      const pos = (h.pnl ?? 0) >= 0;
                      const invested =
                        h.investedValue ??
                        (h.buyPrice != null && h.quantity != null
                          ? h.buyPrice * h.quantity
                          : null);
                      return (
                        <tr
                          key={h._id}
                          className="border-t border-gray-800 hover:bg-gray-900/40 transition-colors"
                        >
                          <td className="px-4 py-3.5 font-bold text-white">
                            <div className="flex items-center gap-2">
                              <StockAvatar symbol={h.symbol} size={28} />
                              <span>{h.symbol}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-gray-400 max-w-[140px] truncate">
                            {h.companyName || "—"}
                          </td>
                          <td className="px-4 py-3.5 text-gray-300 font-mono">
                            {h.quantity}
                          </td>
                          <td className="px-4 py-3.5 text-gray-300 font-mono">
                            {h.buyPrice != null
                              ? `₹${h.buyPrice.toLocaleString()}`
                              : "—"}
                          </td>
                          <td className="px-4 py-3.5 text-white font-mono font-semibold">
                            {h.currentPrice != null
                              ? `₹${h.currentPrice.toLocaleString()}`
                              : "—"}
                          </td>
                          <td className="px-4 py-3.5 text-gray-300 font-mono">
                            {invested != null
                              ? `₹${invested.toLocaleString()}`
                              : "—"}
                          </td>
                          <td className="px-4 py-3.5 text-white font-mono font-semibold">
                            {h.currentValue != null
                              ? `₹${h.currentValue.toLocaleString()}`
                              : "—"}
                          </td>
                          <td
                            className={`px-4 py-3.5 font-mono font-bold ${
                              h.pnl != null
                                ? pos
                                  ? "text-emerald-400"
                                  : "text-red-400"
                                : "text-gray-400"
                            }`}
                          >
                            {h.pnl != null
                              ? `${pos ? "+" : ""}₹${h.pnl.toLocaleString()}`
                              : "—"}
                          </td>
                          <td
                            className={`px-4 py-3.5 font-mono font-bold ${
                              h.pnlPercent != null
                                ? pos
                                  ? "text-emerald-400"
                                  : "text-red-400"
                                : "text-gray-400"
                            }`}
                          >
                            {h.pnlPercent != null
                              ? `${pos ? "+" : ""}${h.pnlPercent.toFixed(2)}%`
                              : "—"}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/charts?symbol=${encodeURIComponent(h.symbol)}`}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                                title={`Open Interactive Chart for ${h.symbol}`}
                              >
                                <IconLineChart size={14} />
                              </Link>
                              <button
                                onClick={() => handleRemove(h._id)}
                                aria-label={`Remove ${h.symbol} from portfolio`}
                                className="p-1.5 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                title="Remove holding"
                              >
                                <IconTrash size={14} aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </FadeIn>
          )}
        </main>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </ProtectedRoute>
  );
}
