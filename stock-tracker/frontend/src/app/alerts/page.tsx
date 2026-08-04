import type { Metadata } from "next";
import AlertsClient from "./AlertsClient";

export const metadata: Metadata = {
  title: "Price Alerts",
  description:
    "Set price alerts on any NSE stock and get notified when your target is hit.",
};

export default function AlertsPage() {
  return <AlertsClient />;
}
