"use client";

import { useAuthGuard } from "@/hooks/useAuthGuard";
import { AppShell } from "@/components/layout/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, userProfile } = useAuthGuard();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !userProfile?.onboardingComplete) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
