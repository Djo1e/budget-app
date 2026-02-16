"use client";

import { OnboardingOptionCard } from "./OnboardingOptionCard";
import { OnboardingStepLayout } from "./OnboardingStepLayout";
import type { StepConfig } from "@/lib/onboarding-categories";

interface StepSelectionProps {
  config: StepConfig;
  selected: string[];
  onSelect: (selected: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  isLastStep?: boolean;
  showPartnerOption?: boolean;
}

export function StepSelection({
  config,
  selected,
  onSelect,
  onNext,
  onBack,
  isLastStep = false,
  showPartnerOption = true,
}: StepSelectionProps) {
  const options = config.options.filter(
    (opt) => showPartnerOption || opt.id !== "their-spending-money"
  );

  function handleToggle(id: string) {
    if (config.mode === "single") {
      onSelect([id]);
    } else {
      onSelect(
        selected.includes(id)
          ? selected.filter((s) => s !== id)
          : [...selected, id]
      );
    }
  }

  function handleSkip() {
    onSelect([]);
    onNext();
  }

  const hasSelection = selected.length > 0;
  const useWideGrid = options.length >= 6;

  return (
    <OnboardingStepLayout
      emoji={config.emoji}
      title={config.title}
      onNext={onNext}
      onBack={onBack}
      nextLabel={isLastStep ? "Finish" : "Next"}
      nextDisabled={!hasSelection && !config.skipText}
      skipText={config.skipText}
      onSkip={handleSkip}
    >
      <div
        className={
          useWideGrid
            ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
            : "flex flex-col gap-3 max-w-md mx-auto"
        }
      >
        {options.map((opt) => (
          <OnboardingOptionCard
            key={opt.id}
            label={opt.label}
            emoji={opt.emoji}
            selected={selected.includes(opt.id)}
            onClick={() => handleToggle(opt.id)}
          />
        ))}
      </div>
    </OnboardingStepLayout>
  );
}
