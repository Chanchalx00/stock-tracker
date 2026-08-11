import { Metadata } from "next";
import AiAnalysisClient from "./AiAnalysisClient";

export const metadata: Metadata = {
  title: "AI Analysis & Momentum Mantra | Stocklytics",
  description:
    "Real-time AI Momentum Mantra evaluations, Grey Market Premium (GMP %), subscription multipliers, listing day strategies, and equity momentum screeners.",
};

export default function AiAnalysisPage() {
  return <AiAnalysisClient />;
}
