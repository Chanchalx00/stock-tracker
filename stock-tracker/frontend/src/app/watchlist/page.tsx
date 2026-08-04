import type { Metadata } from "next";
import WatchlistClient from "./WatchlistClient";

export const metadata: Metadata = {
  title: "Watchlist",
  description: "Track your favourite NSE stocks with live price updates.",
};

export default function WatchlistPage() {
  return <WatchlistClient />;
}
