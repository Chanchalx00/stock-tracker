"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { ChevronDown, TrendingUp, TrendingDown } from "lucide-react";

interface Alert {
  _id: string;
  symbol: string;
  condition: "GREATER_THAN" | "LESS_THAN";
  targetPrice: number;
  isTriggered: boolean;
  triggeredAt?: string;
  triggeredPrice?: number;
  createdAt: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    symbol: "",
    condition: "GREATER_THAN",
    targetPrice: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/alerts");
      setAlerts(data.data);
    } catch {}
    setLoading(false);
  };

  const createAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      await api.post("/alerts", {
        symbol: form.symbol.toUpperCase(),
        condition: form.condition,
        targetPrice: +form.targetPrice,
      });

      setForm({
        symbol: "",
        condition: "GREATER_THAN",
        targetPrice: "",
      });

      fetchAlerts();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create alert.");
    } finally {
      setCreating(false);
    }
  };

  const deleteAlert = async (id: string) => {
    await api.delete(`/alerts/${id}`);
    setAlerts((prev) => prev.filter((a) => a._id !== id));
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950">
        <Navbar />

        <main className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
          <h1 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6">
            Price Alerts
          </h1>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">
              Create New Alert
            </h2>

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            <form onSubmit={createAlert} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  placeholder="Symbol (e.g. AAPL)"
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                  required
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />

                <div className="relative w-full">
                  <select
                    value={form.condition}
                    onChange={(e) =>
                      setForm({ ...form, condition: e.target.value })
                    }
                    className="appearance-none w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="GREATER_THAN" className="text-sm">
                      Greater Than
                    </option>
                    <option value="LESS_THAN">Less Than</option>
                  </select>

                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center gap-1">
                    {form.condition === "GREATER_THAN" ? (
                      <TrendingUp size={16} className="text-emerald-400" />
                    ) : (
                      <TrendingDown size={16} className="text-red-400" />
                    )}
                    <ChevronDown size={16} />
                  </div>
                </div>

                <div className="flex gap-2 sm:col-span-1 col-span-1">
                  <input
                    type="number"
                    placeholder="Target Price"
                    value={form.targetPrice}
                    onChange={(e) =>
                      setForm({ ...form, targetPrice: e.target.value })
                    }
                    required
                    min="0"
                    step="0.01"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />

                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors whitespace-nowrap"
                  >
                    {creating ? "..." : "Set"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {loading ? (
            <div className="flex justify-center py-10 sm:py-12">
              <div className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : alerts.length === 0 ? (
            <p className="text-center text-gray-500 py-10 sm:py-12 text-sm sm:text-base">
              No alerts set yet.
            </p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert._id}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl px-3 sm:px-4 py-3 border ${
                    alert.isTriggered
                      ? "bg-emerald-500/5 border-emerald-500/30"
                      : "bg-gray-900 border-gray-800"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-sm sm:text-base">
                        {alert.symbol}
                      </span>

                      <span className="text-xs text-gray-400">
                        {alert.condition === "GREATER_THAN" ? ">" : "<"} ₹
                        {alert.targetPrice}
                      </span>

                      {alert.isTriggered && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                          Triggered @ ₹{alert.triggeredPrice}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500">
                      Created: {new Date(alert.createdAt).toLocaleDateString()}
                      {alert.triggeredAt &&
                        ` · Triggered: ${new Date(
                          alert.triggeredAt,
                        ).toLocaleString()}`}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteAlert(alert._id)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
