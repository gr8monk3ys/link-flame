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
            'group inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors',
            className
          )}
        >
          <Sparkles className="w-4 h-4" />
          Find your perfect products
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
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
            'hover:shadow-md transition-shadow',
            className
          )}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-1">
                Not sure where to start?
              </h3>
              <p className="text-sm text-muted-foreground">
                Take our quick quiz to discover eco-friendly products tailored to
                your lifestyle.
              </p>
            </div>

            <Button onClick={() => setIsModalOpen(true)} className="w-full">
              Take the Quiz
              <ArrowRight className="w-4 h-4 ml-2" />
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
          'relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background',
          'border-y',
          className
        )}
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <Leaf className="absolute top-8 right-12 w-8 h-8 text-primary/10 rotate-45" />
          <Leaf className="absolute bottom-8 left-12 w-12 h-12 text-primary/10 -rotate-12" />
        </div>

        <div className="container relative py-16 md:py-20">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Personalized Recommendations
            </div>

            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Find Your Perfect Eco-Friendly Products
            </h2>

            <p className="text-lg text-muted-foreground">
              Answer a few quick questions about your lifestyle and preferences,
              and we&apos;ll recommend sustainable products tailored just for you.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => setIsModalOpen(true)}
                className="px-8 gap-2"
              >
                <Sparkles className="w-5 h-5" />
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
