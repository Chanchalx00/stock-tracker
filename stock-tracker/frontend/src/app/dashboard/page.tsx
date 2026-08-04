import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Live NSE stock prices, Nifty 50 and Sensex index charts, and market search — all in one dashboard.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
