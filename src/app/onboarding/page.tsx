"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { StepName } from "@/components/onboarding/StepName";
import { StepSelection } from "@/components/onboarding/StepSelection";
import {
  steps,
  initialSelections,
  buildCategoryTemplate,
  type OnboardingSelections,
} from "@/lib/onboarding-categories";

const TOTAL_STEPS = 1 + steps.length;

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<OnboardingSelections>(initialSelections);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const session = authClient.useSession();
  const createProfile = useMutation(api.users.createProfile);
  const createDefaultTemplate = useMutation(api.categories.createDefaultTemplate);
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  function handleNext() {
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  async function handleFinish() {
    if (!session.data?.user || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const profileId = await createProfile({
        name: selections.name,
        email: session.data.user.email ?? "",
      });

      const template = buildCategoryTemplate(selections);
      await createDefaultTemplate({ userId: profileId, template });
      await completeOnboarding();

      router.push("/dashboard");
    } catch {
      setIsSubmitting(false);
    }
  }

  const hasPartner = selections.household.includes("partner");

  if (currentStep === 0) {
    return (
      <div className="space-y-6">
        <div className="h-1 bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <StepName
          name={selections.name}
          setName={(name) => setSelections((s) => ({ ...s, name }))}
          onNext={handleNext}
        />
      </div>
    );
  }

  const stepIndex = currentStep - 1;
  const stepConfig = steps[stepIndex];
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  function getSelected(): string[] {
    const val = selections[stepConfig.key];
    if (val === null) return [];
    if (typeof val === "string") return [val];
    return val;
  }

  function setSelected(selected: string[]) {
    setSelections((s) => {
      if (stepConfig.mode === "single") {
        return { ...s, [stepConfig.key]: selected[0] ?? null };
      }
      return { ...s, [stepConfig.key]: selected };
    });
  }

  return (
    <div className="space-y-6">
      <div className="h-1 bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <StepSelection
        config={stepConfig}
        selected={getSelected()}
        onSelect={setSelected}
        onNext={isLastStep ? handleFinish : handleNext}
        onBack={handleBack}
        isLastStep={isLastStep}
        showPartnerOption={hasPartner}
      />
    </div>
  );
}
