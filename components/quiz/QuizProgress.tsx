'use client';

import { cn } from '@/lib/utils';

interface QuizProgressProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function QuizProgress({ currentStep, totalSteps, className }: QuizProgressProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Question {currentStep} of {totalSteps}
        </span>
        <span className="text-sm font-medium text-primary">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="size-full origin-left rounded-full bg-primary transition-transform duration-500 ease-out"
          style={{ transform: `scaleX(${progress / 100})` }}
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label={`Progress: ${currentStep} of ${totalSteps} questions completed`}
        />
      </div>
    </div>
  );
}
