"use client";

import { Button } from "@/components/ui/button";

interface OnboardingStepLayoutProps {
  emoji: string;
  title: string;
  children: React.ReactNode;
  skipText?: string;
  onSkip?: () => void;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}

export function OnboardingStepLayout({
  emoji,
  title,
  children,
  skipText,
  onSkip,
  onBack,
  onNext,
  nextLabel = "Next",
  nextDisabled = false,
}: OnboardingStepLayoutProps) {
  return (
    <div className="flex min-h-[400px] flex-col">
      <div className="flex-1 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">
            {emoji && <span className="mr-1">{emoji}</span>}
            {title}
          </h1>
        </div>

        {children}

        {skipText && onSkip && (
          <div className="text-center">
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-primary hover:underline"
            >
              {skipText}
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-8">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
        )}
        <Button onClick={onNext} disabled={nextDisabled}>
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}
