"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingStepLayout } from "./OnboardingStepLayout";

interface StepNameProps {
  name: string;
  setName: (name: string) => void;
  onNext: () => void;
}

export function StepName({ name, setName, onNext }: StepNameProps) {
  return (
    <OnboardingStepLayout
      emoji=""
      title="Let's get started."
      onNext={onNext}
      nextDisabled={name.trim().length === 0}
    >
      <div className="space-y-4 max-w-sm mx-auto">
        <p className="text-center text-muted-foreground">
          First things first, what should we call you?
        </p>
        <div className="space-y-2">
          <Label htmlFor="onboarding-name">Name</Label>
          <Input
            id="onboarding-name"
            placeholder="Your first name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim().length > 0) onNext();
            }}
            autoFocus
          />
        </div>
      </div>
    </OnboardingStepLayout>
  );
}
