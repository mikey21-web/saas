"use client";
import React, { useState } from "react";
import Step1Brand from "./components/step-1-brand";
import Step2Audience from "./components/step-2-audience";
import Step3Voice from "./components/step-3-voice";
import Step4Platforms from "./components/step-4-platforms";
import Step5Competitors from "./components/step-5-competitors";
import Step6Taste from "./components/step-6-taste";
import Step7Goals from "./components/step-7-goals";
import Step8Approval from "./components/step-8-approval";
import CompletionScreen from "./components/completion-screen";

const TOTAL_STEPS = 8;

const initialOnboardingData = {
  niche_name: "",
  what_you_sell: "",
  market: "",
  audience_persona: {},
  tone_preset: {},
  language_preference: "English",
  always_words: [],
  never_words: [],
  platforms: [],
  posting_frequency: {},
  best_posting_times: {},
  competitor_handles: [],
  competitor_likes: "",
  competitor_diff: "",
  taste_responses: [],
  primary_goal: "",
  campaign_notes: "",
  approval_required: true,
};

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState(initialOnboardingData);
  const [completed, setCompleted] = useState(false);
  const [nkpId, setNkpId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = (data: any) => {
    setOnboardingData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS + 1));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleComplete = async () => {
    setCompleted(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(onboardingData),
      });
      const result = await res.json();
      if (result.success) {
        setNkpId(result.nkp_id);
        window.location.href = "/dashboard";
      } else {
        setError(result.error || "Unknown error");
        setCompleted(false);
      }
    } catch (e) {
      setError("Something went wrong. Please try again.");
      setCompleted(false);
    }
  };

  // Progress bar width
  const progress = Math.min((step - 1) / TOTAL_STEPS, 1) * 100;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-full max-w-xl px-4 py-8">
        {/* Progress Bar */}
        <div className="h-1 w-full bg-gray-200 rounded-full mb-8">
          <div
            className="h-1 bg-purple-600 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Stepper */}
        {completed ? (
          <CompletionScreen error={error} onRetry={handleComplete} />
        ) : (
          <div className="relative">
            {step === 1 && (
              <Step1Brand
                data={onboardingData}
                onUpdate={handleUpdate}
                onNext={handleNext}
              />
            )}
            {step === 2 && (
              <Step2Audience
                data={onboardingData}
                onUpdate={handleUpdate}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {step === 3 && (
              <Step3Voice
                data={onboardingData}
                onUpdate={handleUpdate}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {step === 4 && (
              <Step4Platforms
                data={onboardingData}
                onUpdate={handleUpdate}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {step === 5 && (
              <Step5Competitors
                data={onboardingData}
                onUpdate={handleUpdate}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {step === 6 && (
              <Step6Taste
                data={onboardingData}
                onUpdate={handleUpdate}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {step === 7 && (
              <Step7Goals
                data={onboardingData}
                onUpdate={handleUpdate}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {step === 8 && (
              <Step8Approval
                data={onboardingData}
                onUpdate={handleUpdate}
                onComplete={handleComplete}
                onBack={handleBack}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
