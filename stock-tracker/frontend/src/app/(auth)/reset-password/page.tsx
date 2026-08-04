import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Set a new password for your Stocklytics account.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-gray-950 flex items-center justify-center">
          <Spinner size="lg" label="Loading…" />
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
