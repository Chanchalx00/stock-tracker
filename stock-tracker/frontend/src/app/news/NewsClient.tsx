"use client";

import { useEffect, useState, useCallback, useMemo } from "react";

import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";
import FadeIn from "@/components/FadeIn";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import NewsList, { NewsItem } from "@/components/NewsList";

import {
  IconNews,
  IconRefresh,
  IconSearch,
  IconActivity,
  IconTrendingUp,
  IconClock,
  IconZap,
} from "@/lib/icons";
import { useToast } from "@/hooks/useToast";
import { getSocket } from "@/lib/socket";
import api from "@/lib/api";

const CATEGORIES = [
  { label: "ALL", value: "ALL" },
  { label: "MARKET", value: "MARKET" },
  { label: "EARNINGS", value: "EARNINGS" },
  { label: "ECONOMY", value: "ECONOMY" },
  { label: "IPO", value: "IPO" },
  { label: "TECH", value: "TECH" },
];

type SortOption = "latest" | "volFactor" | "topMovers";

export default function NewsClient() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const { toast, success, error: toastError } = useToast();

  const loadNews = useCallback(async () => {
    setLoading(true);
    setUnreadCount(0);
    try {
      const { data } = await api.get("/news");
      setNews(data.data || []);
    } catch {
      toastError("Could not load news. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => setIsLiveConnected(true);
    const handleDisconnect = () => setIsLiveConnected(false);

    if (socket.connected) {
      setIsLiveConnected(true);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    const handleNewsItem = (item: NewsItem) => {
      setNews((prev) => {
        if (
          prev.some(
            (n) =>
              n.id === item.id ||
              n.link === item.link ||
              n.title === item.title,
          )
        ) {
          return prev;
        }
        const updated = [{ ...item, isNew: true }, ...prev];
        return updated.slice(0, 50);
      });
      setUnreadCount((count) => count + 1);
      success(`Live News: ${item.title.substring(0, 45)}…`);
    };

    socket.on("news:item", handleNewsItem);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("news:item", handleNewsItem);
    };
  }, [success]);

  const filteredAndSortedNews = useMemo(() => {
    const filtered = news.filter((item) => {
      const matchesCategory =
        selectedCategory === "ALL" ||
        item.category?.toUpperCase() === selectedCategory;

      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.symbol?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "volFactor") {
        return (b.volFactor ?? 1) - (a.volFactor ?? 1);
      }
      if (sortBy === "topMovers") {
        return Math.abs(b.percentChange ?? 0) - Math.abs(a.percentChange ?? 0);
      }
      const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [news, selectedCategory, searchQuery, sortBy]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setUnreadCount(0);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 py-8">
          <FadeIn>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <IconNews size={22} aria-hidden="true" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold text-white tracking-tight">
                        Live Market News Intelligence
                      </h1>
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        <span
                          className={`w-2 h-2 rounded-full ${isLiveConnected ? "bg-emerald-400 animate-ping" : "bg-gray-500"}`}
                        />
                        {isLiveConnected ? "LIVE FEED" : "CONNECTING"}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Real-time financial headlines, market impact insights,
                      volume factors, & 52-week position gauges
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<IconRefresh size={12} />}
                  onClick={loadNews}
                  loading={loading}
                  aria-label="Refresh news feed"
                >
                  Refresh
                </Button>
              </div>
            </div>

            <div className="mb-6 space-y-3">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search live market news (e.g. Reliance, TCS, RBI, Nifty, Earnings)..."
                leftAddon={<IconSearch size={14} />}
                aria-label="Search live news"
              />

              <div className="flex items-center justify-between flex-wrap gap-3">
                {/* Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-colors ${
                        selectedCategory === cat.value
                          ? "bg-emerald-500 text-black border-emerald-500 shadow-md shadow-emerald-500/20 font-bold"
                          : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center bg-gray-900 border border-gray-800 p-1 rounded-xl text-xs">
                  <span className="text-[11px] text-gray-500 font-semibold px-2 hidden sm:inline">
                    Sort:
                  </span>
                  <button
                    onClick={() => setSortBy("latest")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                      sortBy === "latest"
                        ? "bg-gray-800 text-emerald-400 font-bold border-gray-700 shadow-sm"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    <IconClock size={12} />
                    <span>Latest</span>
                  </button>
                  <button
                    onClick={() => setSortBy("volFactor")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                      sortBy === "volFactor"
                        ? "bg-gray-800 text-emerald-400 font-bold border-gray-700 shadow-sm"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    <IconZap size={12} />
                    <span>Vol Factor</span>
                  </button>
                  <button
                    onClick={() => setSortBy("topMovers")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                      sortBy === "topMovers"
                        ? "bg-gray-800 text-emerald-400 font-bold border-gray-700 shadow-sm"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    <IconTrendingUp size={12} />
                    <span>Top Movers</span>
                  </button>
                </div>
              </div>
            </div>

            {unreadCount > 0 && (
              <div className="mb-4 flex justify-center sticky top-20 z-20">
                <button
                  onClick={scrollToTop}
                  className="bg-emerald-500 text-black font-bold text-xs px-4 py-2 rounded-full shadow-lg shadow-emerald-500/30 flex items-center gap-2 animate-bounce hover:scale-105 transition-transform"
                >
                  <IconActivity size={14} />
                  <span>
                    {unreadCount} new live update{unreadCount > 1 ? "s" : ""} —
                    View Top
                  </span>
                </button>
              </div>
            )}
          </FadeIn>

          <FadeIn delay={0.05}>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3 px-1">
              <span>
                Showing {filteredAndSortedNews.length} headline
                {filteredAndSortedNews.length !== 1 ? "s" : ""}
                {selectedCategory !== "ALL" ? ` in ${selectedCategory}` : ""}
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Feed Active
              </span>
            </div>

            <NewsList
              news={filteredAndSortedNews}
              loading={loading}
              emptyMessage={
                searchQuery
                  ? `No live news found matching "${searchQuery}".`
                  : `No recent ${selectedCategory} news available right now.`
              }
              skeletonCount={8}
            />
          </FadeIn>
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </ProtectedRoute>
  );
}
