"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { StepCurrency } from "@/components/onboarding/StepCurrency";
import { StepAccounts } from "@/components/onboarding/StepAccounts";
import { StepIncome } from "@/components/onboarding/StepIncome";
import { StepCategories } from "@/components/onboarding/StepCategories";
import { StepAssign } from "@/components/onboarding/StepAssign";
import type { Id } from "../../../convex/_generated/dataModel";

const STEPS = ["Currency", "Accounts", "Income", "Categories", "Assign"];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [profileId, setProfileId] = useState<Id<"userProfiles"> | null>(null);
  const router = useRouter();

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  function handleNext() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }

  function handleFinish() {
    router.push("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Step {currentStep + 1} of {STEPS.length}
          </span>
          <span>{STEPS[currentStep]}</span>
        </div>
        <Progress value={progress} />
      </div>

      {currentStep === 0 && (
        <StepCurrency
          currency={currency}
          setCurrency={setCurrency}
          onNext={handleNext}
          setProfileId={setProfileId}
        />
      )}
      {currentStep === 1 && profileId && (
        <StepAccounts
          profileId={profileId}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}
      {currentStep === 2 && profileId && (
        <StepIncome
          profileId={profileId}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}
      {currentStep === 3 && profileId && (
        <StepCategories
          profileId={profileId}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}
      {currentStep === 4 && profileId && (
        <StepAssign
          profileId={profileId}
          currency={currency}
          onFinish={handleFinish}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
