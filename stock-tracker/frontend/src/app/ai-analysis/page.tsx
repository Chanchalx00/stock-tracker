import { Metadata } from "next";
import AiAnalysisClient from "./AiAnalysisClient";

export const metadata: Metadata = {
  title: "AI Analysis IPO & Equity | Stocklytics",
  description:
    "Real-time AI IPO & Equity Momentum evaluations, Grey Market Premium (GMP %), subscription multipliers, listing day strategies, and equity momentum screeners.",
};

export default function AiAnalysisPage() {
  return <AiAnalysisClient />;
}
