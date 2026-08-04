"use client";

import { useEffect, useState, useCallback } from "react";

import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";
import FadeIn from "@/components/FadeIn";
import Button from "@/components/ui/Button";
import NewsList, { NewsItem } from "@/components/NewsList";

import { IconNews, IconRefresh } from "@/lib/icons";
import { useToast } from "@/hooks/useToast";
import api from "@/lib/api";

export default function NewsClient() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, error: toastError } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
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
    load();
  }, [load]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950">
        <Navbar />

        <main className="max-w-3xl mx-auto px-4 py-8">
          <FadeIn>
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconNews size={22} className="text-emerald-400" aria-hidden="true" />
                <h1 className="text-2xl font-bold text-white">Latest News</h1>
              </div>

              <Button
                variant="secondary"
                size="sm"
                leftIcon={<IconRefresh size={12} />}
                onClick={load}
                loading={loading}
                aria-label="Refresh news"
              >
                Refresh
              </Button>
            </div>

            <p className="text-gray-500 text-sm mb-6">
              Top headlines from the Indian stock market
            </p>
          </FadeIn>

          <FadeIn delay={0.05}>
            <NewsList
              news={news}
              loading={loading}
              emptyMessage="No market news available right now."
              skeletonCount={6}
            />
          </FadeIn>
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </ProtectedRoute>
  );
}
