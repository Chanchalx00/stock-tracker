"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { AlertBanner } from "@/components/ui/AlertBanner";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import {
  IconTrendingUp,
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff,
} from "@/lib/icons";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <IconTrendingUp
              size={28}
              className="text-emerald-400"
              aria-hidden="true"
            />
            <h1 className="text-3xl font-bold text-emerald-400">Stocklytics</h1>
          </div>
          <p className="text-gray-400 text-sm">Sign in to your account</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          {error && <AlertBanner variant="error">{error}</AlertBanner>}

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            placeholder="you@example.com"
            leftAddon={<IconMail size={14} />}
            autoComplete="email"
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
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
            autoComplete="current-password"
          />

          <Button
            type="submit"
            fullWidth
            loading={loading}
            onClick={handleSubmit as any}
          >
            Sign In
          </Button>
        </div>

        <p className="text-center text-gray-400 text-sm mt-4">
          No account?{" "}
          <Link
            href="/signup"
            className="text-emerald-400 underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
