"use client";

import { cn } from "@/lib/utils";
import { Check, Globe, Brain, Film, Megaphone, BarChart3 } from "lucide-react";
import Link from "next/link";

const CAMPAIGN_STEPS = [
  {
    number: 1,
    label: "Fetch Context",
    icon: Globe,
    path: "",
  },
  {
    number: 2,
    label: "AI Strategy",
    icon: Brain,
    path: "/strategy",
  },
  {
    number: 3,
    label: "Media Production",
    icon: Film,
    path: "/media",
  },
  {
    number: 4,
    label: "Ad Distribution",
    icon: Megaphone,
    path: "/publish",
  },
  {
    number: 5,
    label: "Analytics",
    icon: BarChart3,
    path: "/analytics",
  },
];

interface CampaignStepperProps {
  campaignId: string;
  currentStep: number;
}

export function CampaignStepper({
  campaignId,
  currentStep,
}: CampaignStepperProps) {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto pb-2">
      {CAMPAIGN_STEPS.map((step, index) => {
        const isCompleted = step.number < currentStep;
        const isCurrent = step.number === currentStep;
        const isDisabled = step.number > currentStep;
        const Icon = step.icon;

        const href =
          step.number === 1
            ? `/campaigns/${campaignId}`
            : `/campaigns/${campaignId}${step.path}`;

        return (
          <div key={step.number} className="flex items-center">
            {index > 0 && (
              <div
                className={cn(
                  "h-px w-6 mx-1",
                  isCompleted ? "bg-primary" : "bg-muted"
                )}
              />
            )}
            {isDisabled ? (
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground opacity-50">
                <StepIconWrapper
                  number={step.number}
                  completed={false}
                  current={false}
                >
                  <Icon className="h-3.5 w-3.5" />
                </StepIconWrapper>
                <span className="hidden sm:inline whitespace-nowrap">
                  {step.label}
                </span>
              </div>
            ) : (
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors whitespace-nowrap",
                  isCurrent && "bg-primary/10 text-primary font-medium",
                  isCompleted && "text-primary hover:bg-primary/5",
                  !isCurrent &&
                    !isCompleted &&
                    "text-muted-foreground hover:bg-muted"
                )}
              >
                <StepIconWrapper
                  number={step.number}
                  completed={isCompleted}
                  current={isCurrent}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                </StepIconWrapper>
                <span className="hidden sm:inline">{step.label}</span>
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function StepIconWrapper({
  completed,
  current,
  children,
}: {
  number?: number;
  completed: boolean;
  current: boolean;
  children: React.ReactNode;
}) {
  if (completed) {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full",
        current
          ? "bg-primary text-primary-foreground"
          : "border border-muted-foreground/30 text-muted-foreground"
      )}
    >
      {children}
    </div>
  );
}
