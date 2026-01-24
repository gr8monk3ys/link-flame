'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface QuizOption {
  value: string;
  label: string;
}

interface QuizQuestionProps {
  question: string;
  options: QuizOption[];
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  selectedValue: string | string[] | null;
  onSelect: (value: string | string[]) => void;
  isAnimating?: boolean;
}

export function QuizQuestion({
  question,
  options,
  questionType,
  selectedValue,
  onSelect,
  isAnimating = false,
}: QuizQuestionProps) {
  const [animationClass, setAnimationClass] = useState('opacity-0 translate-x-4');

  useEffect(() => {
    // Reset animation on question change
    setAnimationClass('opacity-0 translate-x-4');
    const timer = setTimeout(() => {
      setAnimationClass('opacity-100 translate-x-0');
    }, 50);
    return () => clearTimeout(timer);
  }, [question]);

  const handleOptionClick = (value: string) => {
    if (questionType === 'SINGLE_CHOICE') {
      onSelect(value);
    } else {
      // Multiple choice - toggle selection
      const currentSelection = Array.isArray(selectedValue) ? selectedValue : [];
      const isSelected = currentSelection.includes(value);

      if (isSelected) {
        onSelect(currentSelection.filter((v) => v !== value));
      } else {
        onSelect([...currentSelection, value]);
      }
    }
  };

  const isOptionSelected = (value: string): boolean => {
    if (questionType === 'SINGLE_CHOICE') {
      return selectedValue === value;
    }
    return Array.isArray(selectedValue) && selectedValue.includes(value);
  };

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        animationClass,
        isAnimating && 'pointer-events-none'
      )}
    >
      <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-foreground">
        {question}
      </h2>

      {questionType === 'MULTIPLE_CHOICE' && (
        <p className="text-sm text-muted-foreground mb-4">
          Select all that apply
        </p>
      )}

      <div className="grid gap-3">
        {options.map((option, index) => {
          const isSelected = isOptionSelected(option.value);

          return (
            <button
              key={option.value}
              onClick={() => handleOptionClick(option.value)}
              className={cn(
                'group relative flex items-center gap-4 w-full p-4 rounded-lg border-2 transition-all duration-200 text-left',
                'hover:border-primary/50 hover:bg-primary/5',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                isSelected
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border bg-card'
              )}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
              type="button"
              aria-pressed={isSelected}
            >
              {/* Selection indicator */}
              <div
                className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-200 shrink-0',
                  questionType === 'SINGLE_CHOICE' ? 'rounded-full' : 'rounded-md',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/40 group-hover:border-primary/50'
                )}
              >
                {isSelected && <Check className="w-4 h-4" />}
              </div>

              {/* Option label */}
              <span
                className={cn(
                  'text-base sm:text-lg transition-colors',
                  isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
