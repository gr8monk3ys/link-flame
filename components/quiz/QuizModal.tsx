'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QuizProgress } from './QuizProgress';
import { QuizQuestion } from './QuizQuestion';
import { QuizResults } from './QuizResults';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Loader2, Leaf, X } from 'lucide-react';

interface QuizOption {
  value: string;
  label: string;
}

interface QuizQuestionData {
  id: string;
  visibleId: string;
  question: string;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  options: QuizOption[];
  orderIndex: number;
}

interface QuizProduct {
  id: string;
  title: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  image: string;
  category: string;
  inventory: number;
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions?: QuizQuestionData[];
  onComplete?: (visibleId: string) => void;
}

type QuizState = 'intro' | 'questions' | 'loading' | 'results';

export function QuizModal({
  isOpen,
  onClose,
  questions: initialQuestions,
  onComplete,
}: QuizModalProps) {
  const router = useRouter();
  const [state, setState] = useState<QuizState>('intro');
  const [questions, setQuestions] = useState<QuizQuestionData[]>(initialQuestions || []);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{
    visibleId: string;
    products: QuizProduct[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch questions if not provided
  const fetchQuestions = useCallback(async () => {
    if (questions.length > 0) return;

    setIsLoadingQuestions(true);
    setError(null);

    try {
      const response = await fetch('/api/quiz/questions');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to load questions');
      }

      setQuestions(data.data.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quiz');
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [questions.length]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Delay reset to allow animation
      const timer = setTimeout(() => {
        setState('intro');
        setCurrentQuestionIndex(0);
        setAnswers({});
        setResults(null);
        setError(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleStartQuiz = async () => {
    if (questions.length === 0) {
      await fetchQuestions();
    }
    setState('questions');
  };

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (value: string | string[]) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.visibleId]: value,
    }));
  };

  const canProceed = () => {
    if (!currentQuestion) return false;
    const answer = answers[currentQuestion.visibleId];

    if (currentQuestion.questionType === 'SINGLE_CHOICE') {
      return !!answer;
    } else {
      return Array.isArray(answer) && answer.length > 0;
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setState('loading');
    setError(null);

    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: answers }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to submit quiz');
      }

      setResults({
        visibleId: data.data.visibleId,
        products: data.data.recommendations,
      });
      setState('results');

      if (onComplete) {
        onComplete(data.data.visibleId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
      setState('questions');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetakeQuiz = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setResults(null);
    setState('intro');
  };

  const handleViewResults = () => {
    if (results?.visibleId) {
      router.push(`/quiz/results/${results.visibleId}`);
      onClose();
    }
  };

  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'max-h-[90vh] overflow-y-auto sm:max-w-2xl',
          state === 'results' && 'sm:max-w-4xl'
        )}
      >
        {/* Intro Screen */}
        {state === 'intro' && (
          <>
            <DialogHeader className="pb-4 text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
                <Leaf className="size-8 text-primary" />
              </div>
              <DialogTitle className="text-2xl">
                Find Your Perfect Products
              </DialogTitle>
              <DialogDescription className="mt-2 text-base">
                Answer a few quick questions about your lifestyle and preferences,
                and we&apos;ll recommend eco-friendly products tailored just for you.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                    1
                  </div>
                  <span>Tell us about your sustainability goals</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                    2
                  </div>
                  <span>Share your preferences and values</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                    3
                  </div>
                  <span>Get personalized product recommendations</span>
                </div>
              </div>

              <p className="pt-2 text-center text-sm text-muted-foreground">
                Takes about 2 minutes
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <Button
                size="lg"
                onClick={handleStartQuiz}
                disabled={isLoadingQuestions}
                className="px-8"
              >
                {isLoadingQuestions ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Start Quiz'
                )}
              </Button>
            </div>

            {error && (
              <p className="mt-4 text-center text-sm text-destructive">{error}</p>
            )}
          </>
        )}

        {/* Questions Screen */}
        {state === 'questions' && currentQuestion && (
          <>
            <DialogHeader className="pb-2">
              <QuizProgress
                currentStep={currentQuestionIndex + 1}
                totalSteps={questions.length}
              />
            </DialogHeader>

            <div className="min-h-[300px] py-6">
              <QuizQuestion
                question={currentQuestion.question}
                options={currentQuestion.options}
                questionType={currentQuestion.questionType}
                selectedValue={answers[currentQuestion.visibleId] || null}
                onSelect={handleAnswer}
              />
            </div>

            {error && (
              <p className="mb-4 text-center text-sm text-destructive">{error}</p>
            )}

            <div className="flex items-center justify-between border-t pt-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="mr-2 size-4" />
                Back
              </Button>

              {isLastQuestion ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Getting Results...
                    </>
                  ) : (
                    'Get My Recommendations'
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!canProceed()}>
                  Next
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              )}
            </div>
          </>
        )}

        {/* Loading Screen */}
        {state === 'loading' && (
          <div className="py-12 text-center">
            <Loader2 className="mx-auto mb-4 size-12 animate-spin text-primary" />
            <h3 className="mb-2 text-xl font-semibold">
              Finding Your Perfect Products
            </h3>
            <p className="text-muted-foreground">
              Analyzing your preferences...
            </p>
          </div>
        )}

        {/* Results Screen */}
        {state === 'results' && results && (
          <>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </button>

            <div className="pt-6">
              <QuizResults
                visibleId={results.visibleId}
                products={results.products}
                onRetakeQuiz={handleRetakeQuiz}
                showShareButton={true}
              />

              <div className="mt-6 flex justify-center border-t pt-4">
                <Button onClick={handleViewResults} variant="outline">
                  View Full Results Page
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
