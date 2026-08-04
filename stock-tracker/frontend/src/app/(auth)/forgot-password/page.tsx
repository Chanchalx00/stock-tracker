import type { Metadata } from "next";
import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Request a password reset link for your Stocklytics account.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
