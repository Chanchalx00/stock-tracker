"use client";

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

import {
  IconPortfolio,
  IconAddHolding,
  IconTrash,
  IconTrendingUp,
  IconTrendingDown,
} from "@/lib/icons";

import { usePortfolio } from "@/hooks/usePortfolio";
import { useToast } from "@/hooks/useToast";
import { useState } from "react";

const defaultForm = { symbol: "", quantity: "", buyPrice: "", companyName: "" };

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
      success("Holding added.");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add holding.");
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

  const summaryCards = summary
    ? [
        {
          label: "Invested",
          value: `₹${summary.totalInvested.toLocaleString()}`,
          positive: null,
        },
        {
          label: "Current",
          value: `₹${summary.totalCurrent.toLocaleString()}`,
          positive: null,
        },
        {
          label: "P&L",
          value: `₹${summary.totalPnl.toLocaleString()}`,
          positive: summary.totalPnl >= 0,
        },
        {
          label: "Return",
          value: `${summary.totalPnlPercent.toFixed(2)}%`,
          positive: summary.totalPnlPercent >= 0,
        },
      ]
    : [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <FadeIn>
            <div className="mb-6 flex items-center gap-2">
              <IconPortfolio
                size={22}
                className="text-emerald-400"
                aria-hidden="true"
              />
              <h1 className="text-2xl font-bold text-white">Portfolio P&L</h1>
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
                      className={`text-lg font-bold ${
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

          <FadeIn delay={0.05}>
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
                  placeholder="RELIANCE"
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
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                  min="1"
                />
                <Input
                  label="Buy Price (₹)"
                  type="number"
                  placeholder="150.00"
                  value={form.buyPrice}
                  onChange={(e) => setForm({ ...form, buyPrice: e.target.value })}
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
                description="Add your first stock above."
              />
            </FadeIn>
          ) : (
            <FadeIn delay={0.1}>
              <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="min-w-[900px] w-full text-sm">
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
                        "Current",
                        "Invested",
                        "Value",
                        "P&L",
                        "Return",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="text-left px-3 py-3 font-medium whitespace-nowrap"
                        >
                          {h || <span className="sr-only">Actions</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((h) => {
                      const pos = (h.pnl ?? 0) >= 0;
                      return (
                        <tr
                          key={h._id}
                          className="border-t border-gray-800 hover:bg-gray-900/40 transition-colors"
                        >
                          <td className="px-3 py-3 font-bold text-white">
                            {h.symbol}
                          </td>
                          <td className="px-3 py-3 text-gray-400 max-w-[120px] truncate">
                            {h.companyName}
                          </td>
                          <td className="px-3 py-3 text-gray-400">
                            {h.quantity}
                          </td>
                          <td className="px-3 py-3 text-gray-400">
                            ₹{h.buyPrice.toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-white">
                            {h.currentPrice != null
                              ? `₹${h.currentPrice.toLocaleString()}`
                              : "—"}
                          </td>
                          <td className="px-3 py-3 text-gray-400">
                            ₹{h.investedValue.toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-white">
                            {h.currentValue != null
                              ? `₹${h.currentValue.toLocaleString()}`
                              : "—"}
                          </td>
                          <td
                            className={`px-3 py-3 font-medium ${pos ? "text-emerald-400" : "text-red-400"}`}
                          >
                            {h.pnl != null
                              ? `${pos ? "+" : ""}₹${h.pnl.toLocaleString()}`
                              : "—"}
                          </td>
                          <td
                            className={`px-3 py-3 font-medium ${pos ? "text-emerald-400" : "text-red-400"}`}
                          >
                            {h.pnlPercent != null
                              ? `${pos ? "+" : ""}${h.pnlPercent.toFixed(2)}%`
                              : "—"}
                          </td>
                          <td className="px-3 py-3">
                            <button
                              onClick={() => handleRemove(h._id)}
                              aria-label={`Remove ${h.symbol} from portfolio`}
                              className="text-red-400/70 hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
                            >
                              <IconTrash size={14} aria-hidden="true" />
                            </button>
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
