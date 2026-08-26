"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { AlertBanner } from "@/components/ui/AlertBanner";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FadeIn from "@/components/FadeIn";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { getErrorMessage } from "@/lib/utils";
import { IconTrendingUp, IconUser, IconMail, IconLock, IconEye, IconEyeOff } from "@/lib/icons";
import { useRouter } from "next/navigation";

export default function SignupClient() {
  const { signup, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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
      await signup(form.name, form.email, form.password);
    } catch (err) {
      setError(getErrorMessage(err, "Signup failed."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setError("");
    try {
      await loginWithGoogle(credential);
      router.push("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "Google sign-in failed."));
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <FadeIn className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <IconTrendingUp size={28} className="text-emerald-400" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-emerald-400">Stocklytics</h1>
          </div>
          <p className="text-gray-400 text-sm">Create your account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4"
          aria-label="Create account"
        >
          {error && <AlertBanner variant="error">{error}</AlertBanner>}

          <Input
            label="Name"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="John Doe"
            leftAddon={<IconUser size={14} />}
            autoComplete="name"
          />

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
                {showPassword ? <IconEyeOff size={14} /> : <IconEye size={14} />}
              </button>
            }
            autoComplete="new-password"
          />

          <Button type="submit" fullWidth loading={loading}>
            Create Account
          </Button>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="h-px flex-1 bg-gray-800" aria-hidden="true" />
            <span>OR</span>
            <span className="h-px flex-1 bg-gray-800" aria-hidden="true" />
          </div>

          <GoogleSignInButton
            onCredential={handleGoogleCredential}
            onError={setError}
          />
        </form>

        <p className="text-center text-gray-400 text-sm mt-4">
          Already have an account?{" "}
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
