"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";

interface Holding {
  _id: string;
  symbol: string;
  companyName: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number | null;
  currentValue: number;
  investedValue: number;
  pnl: number;
  pnlPercent: number;
}

interface Summary {
  totalInvested: number;
  totalCurrent: number;
  totalPnl: number;
  totalPnlPercent: number;
}

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    symbol: "",
    quantity: "",
    buyPrice: "",
    companyName: "",
  });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/portfolio");
      setHoldings(data.data.holdings);
      setSummary(data.data.summary);
    } finally {
      setLoading(false);
    }
  };

  const addHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAdding(true);
    try {
      await api.post("/portfolio", {
        symbol: form.symbol.toUpperCase(),
        quantity: +form.quantity,
        buyPrice: +form.buyPrice,
        companyName: form.companyName,
      });

      setForm({ symbol: "", quantity: "", buyPrice: "", companyName: "" });
      fetchPortfolio();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add holding.");
    } finally {
      setAdding(false);
    }
  };

  const deleteHolding = async (id: string) => {
    await api.delete(`/portfolio/${id}`);
    fetchPortfolio();
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />

        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <h1 className="text-xl sm:text-2xl font-bold mb-6">Portfolio P&L</h1>

          {summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                {
                  label: "Invested",
                  value: `₹${summary.totalInvested.toLocaleString()}`,
                  color: "text-white",
                },
                {
                  label: "Current",
                  value: `₹${summary.totalCurrent.toLocaleString()}`,
                  color: "text-white",
                },
                {
                  label: "P&L",
                  value: `₹${summary.totalPnl.toLocaleString()}`,
                  color:
                    summary.totalPnl >= 0 ? "text-emerald-400" : "text-red-400",
                },
                {
                  label: "Return",
                  value: `${summary.totalPnlPercent}%`,
                  color:
                    summary.totalPnlPercent >= 0
                      ? "text-emerald-400"
                      : "text-red-400",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4"
                >
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className={`text-base sm:text-lg font-bold ${item.color}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-6  mb-6">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">
              Add Holding
            </h2>

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            <form
              onSubmit={addHolding}
              className="flex flex-row gap-2"
            >
              <input
                placeholder="Symbol"
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                className="bg-gray-800 border py-2 px-3 border-gray-700 rounded-lg text-sm"
              />

              <input
                placeholder="Company Name"
                value={form.companyName}
                onChange={(e) =>
                  setForm({ ...form, companyName: e.target.value })
                }
                className="bg-gray-800 border px-3 border-gray-700 rounded-lg text-sm"
              />

              <input
                type="number"
                placeholder="Quantity"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="bg-gray-800 border px-3 border-gray-700 rounded-lg text-sm"
              />

              
                <input
                  type="number"
                  placeholder="Buy Price"
                  value={form.buyPrice}
                  onChange={(e) =>
                    setForm({ ...form, buyPrice: e.target.value })
                  }
                  className="bg-gray-800 border px-3 border-gray-700 rounded-lg text-sm"
                />

                <button
                  type="submit"
                  disabled={adding}
                  className=" bg-emerald-500 rounded-lg px-3 text-sm font-semibold"
                >
                  {adding ? "..." : "Add"}
                </button>
              
            </form>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : holdings.length === 0 ? (
            <p className="text-center text-gray-500 py-10">
              No holdings yet. Add your first stock above.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-gray-900">
                  <tr className="text-gray-500 text-xs">
                    {[
                      "Symbol",
                      "Qty",
                      "Buy",
                      "Current",
                      "Invested",
                      "Value",
                      "P&L",
                      "%",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-3 py-3 font-medium whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {holdings.map((h) => (
                    <tr
                      key={h._id}
                      className="border-t border-gray-900 hover:bg-gray-900/40"
                    >
                      <td className="px-3 py-3 font-semibold">{h.symbol}</td>
                      <td className="px-3 py-3 text-gray-400">{h.quantity}</td>
                      <td className="px-3 py-3 text-gray-400">₹{h.buyPrice}</td>
                      <td className="px-3 py-3">{h.currentPrice ?? "—"}</td>
                      <td className="px-3 py-3 text-gray-400">
                        ₹{h.investedValue}
                      </td>
                      <td className="px-3 py-3">₹{h.currentValue}</td>
                      <td
                        className={
                          h.pnl >= 0
                            ? "text-emerald-400 px-3 py-3"
                            : "text-red-400 px-3 py-3"
                        }
                      >
                        {h.pnl}
                      </td>
                      <td
                        className={
                          h.pnlPercent >= 0
                            ? "text-emerald-400 px-3 py-3"
                            : "text-red-400 px-3 py-3"
                        }
                      >
                        {h.pnlPercent}%
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => deleteHolding(h._id)}
                          className="text-red-400 text-xs"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
