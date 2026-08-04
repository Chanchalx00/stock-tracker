"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AlertBanner } from "@/components/ui/AlertBanner";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FadeIn from "@/components/FadeIn";
import {
  IconTrendingUp,
  IconLock,
  IconEye,
  IconEyeOff,
} from "@/lib/icons";
import { getErrorMessage } from "@/lib/utils";

export default function ResetPasswordClient() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !token) return;
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      router.push("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "That reset link is invalid or has expired."));
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
          <p className="text-gray-400 text-sm">Choose a new password</p>
        </div>

        {!token ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center space-y-3">
            <AlertBanner variant="error">
              This reset link is missing or malformed.
            </AlertBanner>
            <Link
              href="/forgot-password"
              className="text-emerald-400 underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded text-sm"
            >
              Request a new link
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4"
            aria-label="Choose a new password"
          >
            {error && <AlertBanner variant="error">{error}</AlertBanner>}

            <Input
              label="New password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              leftAddon={<IconLock size={14} />}
              rightAddon={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="pointer-events-auto text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <IconEyeOff size={14} />
                  ) : (
                    <IconEye size={14} />
                  )}
                </button>
              }
              autoComplete="new-password"
            />

            <Input
              label="Confirm new password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              leftAddon={<IconLock size={14} />}
              autoComplete="new-password"
            />

            <Button type="submit" fullWidth loading={loading}>
              Reset password
            </Button>

            <p className="text-gray-500 text-xs text-center">
              This will sign you out of all other devices.
            </p>
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
