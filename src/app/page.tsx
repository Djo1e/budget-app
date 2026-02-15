"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import Link from "next/link";

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white overflow-hidden selection:bg-white selection:text-black">
      {/* Geometric grid accent */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Diagonal accent line */}
      <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] opacity-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "conic-gradient(from 135deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.08) 45deg, transparent 90deg)",
          }}
        />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10 sm:py-6">
        <span className="text-sm font-mono tracking-[0.2em] uppercase opacity-70">
          Budget
        </span>
        <Link
          href="/login"
          className="text-sm tracking-wide opacity-60 hover:opacity-100 transition-opacity"
        >
          Log in
        </Link>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col justify-center px-6 sm:px-10 pt-[12vh] sm:pt-[16vh] pb-20">
        <div className="max-w-3xl">
          {/* Overline */}
          <p
            className="text-xs font-mono tracking-[0.3em] uppercase text-white/40 mb-6 animate-[fadeSlideUp_0.6s_ease_forwards] opacity-0"
            style={{ animationDelay: "0.1s" }}
          >
            Zero-based budgeting
          </p>

          {/* Headline */}
          <h1
            className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-8 animate-[fadeSlideUp_0.6s_ease_forwards] opacity-0"
            style={{ animationDelay: "0.25s" }}
          >
            Every dollar
            <br />
            <span className="text-white/30">gets a job.</span>
          </h1>

          {/* Value props */}
          <div
            className="space-y-3 mb-12 animate-[fadeSlideUp_0.6s_ease_forwards] opacity-0"
            style={{ animationDelay: "0.45s" }}
          >
            <p className="text-base sm:text-lg text-white/50 max-w-md leading-relaxed">
              Assign every dollar before you spend it.
              <br />
              Track where it actually goes.
              <br />
              Stay in control — not in the dark.
            </p>
          </div>

          {/* CTA */}
          <div
            className="flex items-center gap-6 animate-[fadeSlideUp_0.6s_ease_forwards] opacity-0"
            style={{ animationDelay: "0.6s" }}
          >
            <Link
              href="/signup"
              className="inline-flex items-center justify-center h-12 px-8 bg-white text-black font-medium text-sm tracking-wide rounded-none hover:bg-white/90 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="text-sm text-white/40 hover:text-white/70 transition-colors tracking-wide"
            >
              I have an account
            </Link>
          </div>
        </div>

        {/* Vertical accent text */}
        <div className="hidden lg:block absolute right-10 top-1/2 -translate-y-1/2">
          <p
            className="text-[11px] font-mono tracking-[0.4em] uppercase text-white/15 animate-[fadeIn_1s_ease_forwards] opacity-0"
            style={{
              writingMode: "vertical-rl",
              animationDelay: "0.8s",
            }}
          >
            Take control of your money
          </p>
        </div>
      </main>

      {/* Bottom rule */}
      <div className="absolute bottom-0 left-0 right-0 px-6 sm:px-10 pb-6">
        <div className="h-px bg-white/10" />
        <div className="flex justify-between items-center mt-4">
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/20">
            Open source
          </span>
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/20">
            Built for clarity
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
