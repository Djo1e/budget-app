"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { authClient } from "@/lib/auth-client";
import { currencies } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StepCurrencyProps {
  currency: string;
  setCurrency: (c: string) => void;
  onNext: () => void;
  setProfileId: (id: Id<"userProfiles">) => void;
}

export function StepCurrency({
  currency,
  setCurrency,
  onNext,
  setProfileId,
}: StepCurrencyProps) {
  const createProfile = useMutation(api.users.createProfile);
  const session = authClient.useSession();

  async function handleNext() {
    if (!session.data?.user) return;

    const profileId = await createProfile({
      name: session.data.user.name ?? "",
      email: session.data.user.email ?? "",
      currency,
    });

    setProfileId(profileId);
    onNext();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pick your currency</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger>
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.symbol} {c.code} - {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleNext} className="w-full">
          Next
        </Button>
      </CardContent>
    </Card>
  );
}
