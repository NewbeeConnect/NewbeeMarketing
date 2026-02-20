"use client";

import { WORKFLOW_STEPS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Link from "next/link";

interface WorkflowStepperProps {
  projectId: string;
  currentStep: number;
}

export function WorkflowStepper({ projectId, currentStep }: WorkflowStepperProps) {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto pb-2">
      {WORKFLOW_STEPS.map((step, index) => {
        const isCompleted = step.number < currentStep;
        const isCurrent = step.number === currentStep;
        const isDisabled = step.number > currentStep;

        const href = step.number === 1
          ? `/projects/${projectId}`
          : `/projects/${projectId}${step.path}`;

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
                <StepIcon number={step.number} completed={false} current={false} />
                <span className="hidden sm:inline whitespace-nowrap">{step.label}</span>
              </div>
            ) : (
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors whitespace-nowrap",
                  isCurrent && "bg-primary/10 text-primary font-medium",
                  isCompleted && "text-primary hover:bg-primary/5",
                  !isCurrent && !isCompleted && "text-muted-foreground hover:bg-muted"
                )}
              >
                <StepIcon number={step.number} completed={isCompleted} current={isCurrent} />
                <span className="hidden sm:inline">{step.label}</span>
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function StepIcon({
  number,
  completed,
  current,
}: {
  number: number;
  completed: boolean;
  current: boolean;
}) {
  if (completed) {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check className="h-3.5 w-3.5" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
        current
          ? "bg-primary text-primary-foreground"
          : "border border-muted-foreground/30 text-muted-foreground"
      )}
    >
      {number}
    </div>
  );
}
