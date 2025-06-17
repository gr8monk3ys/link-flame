'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';

const QuizModal = dynamic(
  () => import('./QuizModal').then((mod) => mod.QuizModal),
  { ssr: false, loading: () => null }
);
import { cn } from '@/lib/utils';
import { Leaf, Sparkles, ArrowRight } from 'lucide-react';

interface QuizCTAProps {
  variant?: 'banner' | 'card' | 'inline';
  className?: string;
  onQuizComplete?: (visibleId: string) => void;
}

export function QuizCTA({
  variant = 'banner',
  className,
  onQuizComplete,
}: QuizCTAProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleComplete = (visibleId: string) => {
    if (onQuizComplete) {
      onQuizComplete(visibleId);
    }
  };

  if (variant === 'inline') {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className={cn(
            'group inline-flex items-center gap-2 font-medium text-primary transition-colors hover:text-primary/80',
            className
          )}
        >
          <Sparkles className="size-4" />
          Find your perfect products
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </button>

        <QuizModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onComplete={handleComplete}
        />
      </>
    );
  }

  if (variant === 'card') {
    return (
      <>
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm',
            'transition-shadow hover:shadow-md',
            className
          )}
        >
          <div className="absolute right-0 top-0 size-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5" />
          <div className="absolute bottom-0 left-0 size-24 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary/5" />

          <div className="relative space-y-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="size-6 text-primary" />
            </div>

            <div>
              <h3 className="mb-1 text-lg font-semibold">
                Not sure where to start?
              </h3>
              <p className="text-sm text-muted-foreground">
                Take our quick quiz to discover eco-friendly products tailored to
                your lifestyle.
              </p>
            </div>

            <Button onClick={() => setIsModalOpen(true)} className="w-full">
              Take the Quiz
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>

        <QuizModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onComplete={handleComplete}
        />
      </>
    );
  }

  // Default: banner variant
  return (
    <>
      <section
        className={cn(
          'relative overflow-hidden bg-gradient-to-br from-secondary/50 via-accent/10 to-background',
          'border-y',
          className
        )}
      >
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/4 top-0 size-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 size-96 rounded-full bg-primary/5 blur-3xl" />
          <Leaf className="absolute right-12 top-8 size-8 rotate-45 text-primary/10" />
          <Leaf className="absolute bottom-8 left-12 size-12 -rotate-12 text-primary/10" />
        </div>

        <div className="container relative py-16 md:py-20">
          <div className="mx-auto max-w-2xl space-y-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="size-4" />
              Personalized Recommendations
            </div>

            <h2 className="font-serif text-3xl font-semibold tracking-normal md:text-4xl">
              Find Your Perfect Eco-Friendly Products
            </h2>

            <p className="text-lg text-muted-foreground">
              Answer a few quick questions about your lifestyle and preferences,
              and we&apos;ll recommend sustainable products tailored just for you.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
              <Button
                size="lg"
                onClick={() => setIsModalOpen(true)}
                className="gap-2 px-8"
              >
                <Sparkles className="size-5" />
                Take the Quiz
              </Button>
              <p className="text-sm text-muted-foreground">
                Takes less than 2 minutes
              </p>
            </div>
          </div>
        </div>
      </section>

      <QuizModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={handleComplete}
      />
    </>
  );
}
