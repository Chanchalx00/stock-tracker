"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { AlertBanner } from "@/components/ui/AlertBanner";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FadeIn from "@/components/FadeIn";
import { IconTrendingUp, IconMail, IconSuccess } from "@/lib/icons";
import { getErrorMessage } from "@/lib/utils";

export default function ForgotPasswordClient() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gray-950 flex items-center justify-center px-4">
      <FadeIn className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <IconTrendingUp
              size={28}
              className="text-emerald-400"
              aria-hidden="true"
            />
            <h1 className="text-3xl font-bold text-emerald-400">Stocklytics</h1>
          </div>
          <p className="text-gray-400 text-sm">Reset your password</p>
        </div>

        {sent ? (
          <div
            className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center space-y-3"
            role="status"
          >
            <div
              aria-hidden="true"
              className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto"
            >
              <IconSuccess size={24} className="text-emerald-400" />
            </div>
            <h2 className="text-white font-semibold">Check your email</h2>
            <p className="text-gray-400 text-sm">
              If an account exists for <span className="text-gray-300">{email}</span>,
              we&apos;ve sent a link to reset your password. It expires in 1 hour.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4"
            aria-label="Reset password"
          >
            {error && <AlertBanner variant="error">{error}</AlertBanner>}

            <p className="text-gray-400 text-sm">
              Enter the email you signed up with and we&apos;ll send you a link to
              reset your password.
            </p>

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              leftAddon={<IconMail size={14} />}
              autoComplete="email"
            />

            <Button type="submit" fullWidth loading={loading}>
              Send reset link
            </Button>
          </form>
        )}

        <p className="text-center text-gray-400 text-sm mt-4">
          Remembered it?{" "}
          <Link
            href="/login"
            className="text-emerald-400 underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
          >
            Sign in
          </Link>
        </p>
      </FadeIn>
    </div>
  );
}
