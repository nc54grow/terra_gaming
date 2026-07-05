//new design for login page
"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ROLE_DASHBOARD } from "@/lib/types";
import { supabase } from "@/lib/supabase-client";
import { Loader2, AlertCircle, Mail, Lock } from "lucide-react";
import AuthShell from "@/components/auth/auth-shell";
import AuthField from "@/components/auth/auth-field";
import { TransitionLink } from "@/components/TransitionLink";
import { useTransitionNavigate } from "@/components/transition/page-transition";

export default function LoginPage() {
  const { user, role, loading, signOut } = useAuth();
  const router = useRouter();

  // ✅ Moved to top level - ALL hooks must be called here
  const navigate = useTransitionNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Handle redirect on successful auth
  useEffect(() => {
    if (!loading && user && role) {
      // Use navigate for transition or router.replace for immediate
      navigate(ROLE_DASHBOARD[role]);
    }
  }, [user, role, loading, navigate]);

  const noRoleFound = !loading && user && !role;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;

      // ✅ Success! The useEffect will handle redirect
      // Don't reset submitting here - component will unmount/redirect
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(msg);
      setSubmitting(false); // ✅ Only reset on error
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

  // No role found state - full page with glass background
  // if (noRoleFound) {
  //   const handleSignoutAndReload = async () => {
  //     await signOut();
  //     window.location.reload(); // Force reload to reset state
  //   };

  //   return (
  //     <div className="relative min-h-screen overflow-hidden bg-[#1C1A17]">
  //       {/* Glass background layers */}
  //       <div className="absolute inset-0 bg-gradient-to-br from-[#1C1A17] via-[#2E2B26] to-[#1C1A17]" />

  //       {/* Subtle grid pattern */}
  //       <div className="pointer-events-none absolute inset-0 bg-grid opacity-10" />

  //       {/* Glass blur circles */}
  //       <div className="pointer-events-none absolute -top-20 -right-20 h-[500px] w-[500px] rounded-full bg-[#C84B1F]/10 blur-[120px]" />
  //       <div className="pointer-events-none absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-[#C84B1F]/5 blur-[100px]" />
  //       <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C84B1F]/5 blur-[150px]" />

  //       {/* Glass overlay (full page) */}
  //       <div className="absolute inset-0 backdrop-blur-xl bg-black/30" />

  //       {/* Centered modal content */}
  //       <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
  //         <div className="w-full max-w-md">
  //           {/* Glass card with high contrast */}
  //           <div className="relative bg-[#1C1A17]/90 border border-white/10 shadow-2xl backdrop-blur-xl p-8">
  //             {/* Glass reflection effect */}
  //             <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

  //             {/* Border glow */}
  //             <div className="absolute inset-0 border border-white/5 pointer-events-none" />

  //             {/* Corner accents */}
  //             <div className="absolute -top-px -right-px h-12 w-12 border-t-2 border-r-2 border-[#C84B1F]/40" />
  //             <div className="absolute -bottom-px -left-px h-12 w-12 border-b-2 border-l-2 border-[#C84B1F]/40" />

  //             {/* Content with high contrast */}
  //             <div className="relative z-10">
  //               <div className="mb-6 flex flex-col items-center gap-3">
  //                 <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C84B1F]/10 ring-1 ring-[#C84B1F]/20 backdrop-blur-sm">
  //                   <span className="text-[#C84B1F] text-2xl font-bold">
  //                     BG
  //                   </span>
  //                 </div>
  //               </div>

  //               <h2 className="font-display text-[32px] leading-[0.95] text-[#F0EBE1] tracking-wide mb-2 text-center">
  //                 Account Not Configured
  //               </h2>

  //               <p className="text-sm text-[#B0A89A] mb-4 text-center">
  //                 Your account is authenticated but not linked to any role. This
  //                 can happen if your account was created outside the app or your
  //                 role record is missing.
  //               </p>

  //               <div className="flex items-start gap-2 border border-[#C84B1F]/30 bg-[#C84B1F]/10 px-3 py-2.5 text-sm text-[#C84B1F] backdrop-blur-sm">
  //                 <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
  //                 <span>
  //                   Signed in as{" "}
  //                   <span className="font-semibold text-[#F0EBE1]">
  //                     {user?.email}
  //                   </span>{" "}
  //                   but no role found. Contact an administrator or try a
  //                   different account.
  //                 </span>
  //               </div>

  //               <button
  //                 className="w-full mt-4 bg-[#C84B1F] text-white px-8 py-3.5 text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
  //                 style={{ clipPath: "polygon(0 0,100% 0,96% 100%,0 100%)" }}
  //                 onClick={handleSignoutAndReload}
  //               >
  //                 Sign out and try again
  //               </button>

  //               {/* Close button */}
  //               <button
  //                 onClick={handleSignoutAndReload}
  //                 className="absolute top-4 right-4 text-[#8A8175] hover:text-[#F0EBE1] transition-colors"
  //               >
  //                 <svg
  //                   className="h-5 w-5"
  //                   fill="none"
  //                   viewBox="0 0 24 24"
  //                   stroke="currentColor"
  //                 >
  //                   <path
  //                     strokeLinecap="round"
  //                     strokeLinejoin="round"
  //                     strokeWidth={2}
  //                     d="M6 18L18 6M6 6l12 12"
  //                   />
  //                 </svg>
  //               </button>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <AuthShell
      eyebrow="Battleground Mobile India"
      title={
        <>
          WELCOME
          <br />
          <span className="text-[#C84B1F]">BACK.</span>
        </>
      }
      blurb="Sign in to jump back into the arena. Your squad, your ranked matches, and live prize pools are waiting."
    >
      <div className="mb-8">
        <div className="flex items-center gap-2.5 text-[#C84B1F] text-[10px] font-bold tracking-[0.25em] uppercase mb-4 md:hidden">
          <span className="w-6 h-0.5 bg-[#C84B1F]" />
          Battleground Mobile India
        </div>
        <h2 className="font-display text-[44px] leading-[0.95] text-[#F0EBE1] tracking-wide">
          SIGN IN
        </h2>
        <p className="text-sm text-[#8A8175] mt-2">
          Enter your credentials to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
          placeholder="••••••••"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div className="flex items-start gap-2 border border-[#C84B1F]/30 bg-[#C84B1F]/10 px-3 py-2.5 text-sm text-[#C84B1F]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-[#8A8175] cursor-pointer select-none">
            <input type="checkbox" className="accent-[#C84B1F] w-3.5 h-3.5" />
            Remember me
          </label>
          <Link
            href="#"
            className="text-[#C84B1F] font-semibold uppercase tracking-wider text-[10px]"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="bg-[#C84B1F] text-white px-8 py-3.5 text-xs font-bold uppercase tracking-wider mt-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ clipPath: "polygon(0 0,100% 0,96% 100%,0 100%)" }}
          disabled={submitting}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </span>
          ) : (
            "Enter Arena"
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
          disabled={submitting}
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
        New here?{" "}
        <TransitionLink
          href="/register"
          className="text-[#C84B1F] font-bold border-b border-[#C84B1F] pb-0.5"
        >
          Create Account
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
