"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_DASHBOARD } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Gamepad2,
  Shield,
  Users,
  Building2,
  ArrowRight,
  Zap,
  Lock,
  Globe,
} from "lucide-react";

export default function LandingPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && role) {
      router.replace(ROLE_DASHBOARD[role]);
    }
  }, [user, role, loading, router]);

  const features = [
    {
      icon: Users,
      title: "User Accounts",
      description:
        "Registered users get a personalized dashboard with gaming stats and profile management.",
    },
    {
      icon: Building2,
      title: "Organization Management",
      description:
        "Admin-created organizations with dedicated dashboards for managing teams and resources.",
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      description:
        "Server-side role resolution across three account types — the client never decides your role.",
    },
    {
      icon: Lock,
      title: "Secure Authentication",
      description:
        "Email/password and Google Sign-In for users. Organizations are admin-provisioned only.",
    },
    {
      icon: Zap,
      title: "Real-Time Updates",
      description:
        "Live session management with automatic token refresh and instant role resolution.",
    },
    {
      icon: Globe,
      title: "Scalable Architecture",
      description:
        "Built on Supabase with row-level security policies for every table and operation.",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-glow" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />

      {/* Nav */}
      <nav className="relative z-10 mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <Gamepad2 className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight">TerraGaming</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => router.push("/login")}
            className="text-sm font-medium"
          >
            Sign in
          </Button>
          <Button
            onClick={() => router.push("/login")}
            className="glow-primary"
          >
            Get Started
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pt-20 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-success" />
            Production-ready command center
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Command Your Gaming
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Ecosystem
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
            A production-ready platform for managing the TerraGaming ecosystem.
            Handle authentication, role-based routing, and organization
            management for users, organizations, and admins — all in one place.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              onClick={() => router.push("/login")}
              className="w-full sm:w-auto glow-primary"
            >
              Access Command Center
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full sm:w-auto"
            >
              Explore Features
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-20 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Account Types", value: "3" },
            { label: "Role Resolution", value: "Server-side" },
            { label: "Security", value: "Row-Level" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border/60 bg-card/50 p-6 text-center backdrop-blur-sm transition-colors hover:border-primary/40"
            >
              <div className="text-2xl font-bold text-primary">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="relative z-10 mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8"
      >
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Built for the Gaming Ecosystem
          </h2>
          <p className="mt-2 text-muted-foreground">
            Everything you need to manage users, organizations, and admins.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden border-border/60 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-card/80"
            >
              <CardHeader>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20 transition-transform group-hover:scale-110">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/60 bg-card/30 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              TerraGaming Command Center
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built with Next.js, Supabase, and shadcn/ui
          </p>
        </div>
      </footer>
    </div>
  );
}
