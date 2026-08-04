import type { Metadata } from "next";
import NewsClient from "./NewsClient";

export const metadata: Metadata = {
  title: "Market News",
  description: "Latest headlines from the Indian stock market.",
};

export default function NewsPage() {
  return <NewsClient />;
}
