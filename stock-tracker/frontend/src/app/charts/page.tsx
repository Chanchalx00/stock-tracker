import type { Metadata } from "next";
import ChartsClient from "./ChartsClient";

export const metadata: Metadata = {
  title: "Charts",
  description:
    "TradingView-style candlestick charts with volume for Nifty 50, Sensex, and any NSE stock.",
};

export default function ChartsPage() {
  return <ChartsClient />;
}
