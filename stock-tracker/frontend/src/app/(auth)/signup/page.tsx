import type { Metadata } from "next";
import SignupClient from "./SignupClient";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your free Stocklytics account to start tracking Indian stocks.",
};

export default function SignupPage() {
  return <SignupClient />;
}
