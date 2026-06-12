"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { roleDashboardPath } from "@/config/site";

const steps = [
  {
    title: "What's your budget?",
    options: ["Under $300K", "$300K – $600K", "$600K – $1M", "Over $1M"],
  },
  {
    title: "Preferred location?",
    options: ["Urban", "Suburban", "Rural", "No preference"],
  },
  {
    title: "Top priority?",
    options: ["Schools", "Commute", "Space", "Investment potential"],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Record<number, string>>({});

  const handleSelect = (option: string) => {
    setSelections((s) => ({ ...s, [step]: option }));
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      router.push(user ? roleDashboardPath[user.role] : "/");
    }
  };

  const current = steps[step];

  return (
    <>
      <div className="mb-6 flex gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i <= step ? "bg-ai" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <h1 className="text-2xl font-bold">{current.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Step {step + 1} of {steps.length}
      </p>

      <div className="mt-6 grid gap-2">
        {current.options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => handleSelect(option)}
            className={`rounded-lg border p-4 text-left text-sm font-medium transition-colors ${
              selections[step] === option
                ? "border-ai bg-ai/5 ring-2 ring-ai"
                : "hover:border-ai/50"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <Button
        className="mt-6 w-full"
        variant="ai"
        onClick={handleNext}
        disabled={!selections[step]}
      >
        {step < steps.length - 1 ? "Continue" : "Get my matches"}
      </Button>
    </>
  );
}
