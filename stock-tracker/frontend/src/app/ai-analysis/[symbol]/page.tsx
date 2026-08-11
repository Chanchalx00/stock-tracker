import { Metadata } from "next";
import IpoDeepAnalysisClient from "./IpoDeepAnalysisClient";

export const metadata: Metadata = {
  title: "Deep IPO Analysis & Particulars | Stocklytics",
  description:
    "Comprehensive 20-Point IPO Framework Review, Products & Services Portfolio, Capabilities, Customer Base, Project Presence, and IPO Particulars Table.",
};

export default function IpoDeepAnalysisPage() {
  return <IpoDeepAnalysisClient />;
}
