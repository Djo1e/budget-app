"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function DashboardPage() {
  const profile = useQuery(api.users.getCurrentProfile);

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome, {profile.name}! Your budget is set up and ready to go.
      </p>
    </div>
  );
}
