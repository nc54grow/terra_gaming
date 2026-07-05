"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase-client";
import { ROLE_DASHBOARD } from "@/lib/types";
import Link from "next/link";
import AuthShell from "@/components/auth/auth-shell";
import AuthField from "@/components/auth/auth-field";
import { Loader2, AlertCircle } from "lucide-react";
import { TransitionLink } from "@/components/TransitionLink";

export default function RegisterPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && user && role) {
      router.replace(ROLE_DASHBOARD[role]);
    }
  }, [user, role, loading, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    setSuccess(false);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;

      if (data.user) {
        const { error: profileError } = await supabase.from("tg_users").insert({
          id: data.user.id,
          email,
          display_name: displayName || null,
        });
        if (profileError) throw profileError;
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(msg);
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (googleError) throw googleError;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      setError(msg);
    }
  }

  // Loading state
  if (loading || (user && role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1C1A17]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C84B1F]" />
      </div>
    );
  }

  return (
    <AuthShell
      eyebrow="Battleground Mobile India"
      title={
        <>
          JOIN THE
          <br />
          <span className="text-[#C84B1F]">SQUAD.</span>
        </>
      }
      blurb="Create your account to enter daily squad tournaments, climb the ranked ladder, and compete for live prize pools."
    >
      <div className="mb-8">
        <div className="flex items-center gap-2.5 text-[#C84B1F] text-[10px] font-bold tracking-[0.25em] uppercase mb-4 md:hidden">
          <span className="w-6 h-0.5 bg-[#C84B1F]" />
          Battleground Mobile India
        </div>
        <h2 className="font-display text-[44px] leading-[0.95] text-[#F0EBE1] tracking-wide">
          GET STARTED
        </h2>
        <p className="text-sm text-[#8A8175] mt-2">
          Register your player profile below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <AuthField
          id="displayName"
          type="text"
          label="Display Name (optional)"
          placeholder="GamerTag"
          autoComplete="username"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <AuthField
          id="email"
          type="email"
          label="Email"
          placeholder="you@arena.gg"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthField
          id="password"
          type="password"
          label="Password"
          placeholder="At least 6 characters"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div className="flex items-start gap-2 border border-[#C84B1F]/30 bg-[#C84B1F]/10 px-3 py-2.5 text-sm text-[#C84B1F]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 border border-green-500/30 bg-green-500/10 px-3 py-2.5 text-sm text-green-500">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Account created successfully! Redirecting to login...</span>
          </div>
        )}

        <label className="flex items-start gap-2 text-xs text-[#8A8175] cursor-pointer select-none mt-1">
          <input
            type="checkbox"
            className="accent-[#C84B1F] w-3.5 h-3.5 mt-0.5"
            required
          />
          <span>
            I agree to the{" "}
            <Link href="#" className="text-[#C84B1F] font-semibold">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-[#C84B1F] font-semibold">
              Fair Play Policy
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          className="bg-[#C84B1F] text-white px-8 py-3.5 text-xs font-bold uppercase tracking-wider mt-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ clipPath: "polygon(0 0,100% 0,96% 100%,0 100%)" }}
          disabled={submitting || success}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating Account...
            </span>
          ) : (
            "Create Account"
          )}
        </button>

        {/* Divider */}
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#3D3A35]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#2E2B26] px-2 text-[#8A8175]">or</span>
          </div>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          className="bg-[#2E2B26] text-[#F0EBE1] border border-[#3D3A35] px-8 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-[#3D3A35] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ clipPath: "polygon(0 0,100% 0,96% 100%,0 100%)" }}
          onClick={handleGoogleSignIn}
          disabled={submitting || success}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.24-.72-.38-1.49-.38-2.09s.14-1.37.38-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </span>
        </button>
      </form>

      <p className="text-xs text-[#8A8175] mt-8 uppercase tracking-wider">
        Already registered?{" "}
        <TransitionLink
          href="/login"
          className="text-[#C84B1F] font-bold border-b border-[#C84B1F] pb-0.5"
        >
          Sign In
        </TransitionLink>
      </p>

      <div className="mt-6 border border-[#3D3A35] bg-[#2E2B26]/50 p-3">
        <p className="text-xs text-[#8A8175]">
          <span className="font-semibold text-[#F0EBE1]">Note:</span> Sign up
          creates a<span className="font-medium text-[#C84B1F]"> user</span>{" "}
          account. Organizations are admin-created only and cannot
          self-register.
        </p>
      </div>
    </AuthShell>
  );
}
