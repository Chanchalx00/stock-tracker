import type { Metadata } from "next";
import PortfolioClient from "./PortfolioClient";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Track your stock holdings, invested value, and live profit & loss.",
};

export default function PortfolioPage() {
  return <PortfolioClient />;
}
