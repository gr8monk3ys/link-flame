'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button, ButtonProps } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

const QuizModal = dynamic(
  () => import('./QuizModal').then((mod) => mod.QuizModal),
  { ssr: false, loading: () => null }
);
import { cn } from '@/lib/utils';

interface QuizLauncherProps extends Omit<ButtonProps, 'onClick'> {
  text?: string;
  showIcon?: boolean;
  onQuizComplete?: (visibleId: string) => void;
}

export function QuizLauncher({
  text = 'Take the Quiz',
  showIcon = true,
  onQuizComplete,
  className,
  ...buttonProps
}: QuizLauncherProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleComplete = (visibleId: string) => {
    if (onQuizComplete) {
      onQuizComplete(visibleId);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className={cn(className)}
        {...buttonProps}
      >
        {showIcon && <Sparkles className="w-4 h-4 mr-2" />}
        {text}
      </Button>

      <QuizModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={handleComplete}
      />
    </>
  );
}
