"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useAuthGuard() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();

  const userProfile = useQuery(
    api.users.getCurrentProfile,
    isAuthenticated ? {} : "skip"
  );

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (userProfile === undefined) return;

    if (userProfile === null || !userProfile.onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [isAuthenticated, authLoading, userProfile, router]);

  return {
    isLoading: authLoading || (isAuthenticated && userProfile === undefined),
    isAuthenticated,
    userProfile,
  };
}
