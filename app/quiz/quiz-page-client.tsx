'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { QuizProgress } from '@/components/quiz/QuizProgress';
import { QuizQuestion } from '@/components/quiz/QuizQuestion';
import { QuizResults } from '@/components/quiz/QuizResults';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Loader2, Leaf, Sparkles } from 'lucide-react';

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

type QuizState = 'intro' | 'questions' | 'loading' | 'results';

export function QuizPageClient() {
  const router = useRouter();
  const [state, setState] = useState<QuizState>('intro');
  const [questions, setQuestions] = useState<QuizQuestionData[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{
    visibleId: string;
    products: QuizProduct[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch questions
  const fetchQuestions = useCallback(async () => {
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
  }, []);

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
    } else if (state === 'questions') {
      setState('intro');
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

      // Update URL to shareable results
      window.history.pushState({}, '', `/quiz/results/${data.data.visibleId}`);
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
    window.history.pushState({}, '', '/quiz');
  };

  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="container max-w-3xl px-4">
        {/* Intro Screen */}
        {state === 'intro' && (
          <div
            className={cn(
              'space-y-8 text-center',
              'duration-500 animate-in fade-in-0 slide-in-from-bottom-4'
            )}
          >
            {/* Hero section */}
            <div className="space-y-4">
              <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10">
                <Leaf className="size-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Find Your Perfect
                <br />
                <span className="text-primary">Eco-Friendly Products</span>
              </h1>
              <p className="mx-auto max-w-lg text-lg text-muted-foreground sm:text-xl">
                Answer a few quick questions about your lifestyle and preferences,
                and we&apos;ll recommend sustainable products tailored just for you.
              </p>
            </div>

            {/* How it works */}
            <div className="mx-auto grid max-w-2xl gap-6 py-8 sm:grid-cols-3">
              <div className="flex flex-col items-center gap-3 p-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-xl font-semibold">
                  1
                </div>
                <h3 className="font-medium">Tell Us About You</h3>
                <p className="text-center text-sm text-muted-foreground">
                  Share your sustainability goals and preferences
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 p-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-xl font-semibold">
                  2
                </div>
                <h3 className="font-medium">We Analyze</h3>
                <p className="text-center text-sm text-muted-foreground">
                  Our algorithm finds products that match your needs
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 p-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-xl font-semibold">
                  3
                </div>
                <h3 className="font-medium">Get Recommendations</h3>
                <p className="text-center text-sm text-muted-foreground">
                  Discover personalized eco-friendly products
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-4">
              <Button
                size="lg"
                onClick={handleStartQuiz}
                disabled={isLoadingQuestions}
                className="gap-2 px-12 py-6 text-lg"
              >
                {isLoadingQuestions ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-5" />
                    Start Quiz
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                Takes less than 2 minutes - No account required
              </p>
            </div>

            {error && (
              <p className="mt-4 text-sm text-destructive">{error}</p>
            )}
          </div>
        )}

        {/* Questions Screen */}
        {state === 'questions' && currentQuestion && (
          <div className="space-y-8 duration-300 animate-in fade-in-0">
            <QuizProgress
              currentStep={currentQuestionIndex + 1}
              totalSteps={questions.length}
            />

            <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
              <QuizQuestion
                question={currentQuestion.question}
                options={currentQuestion.options}
                questionType={currentQuestion.questionType}
                selectedValue={answers[currentQuestion.visibleId] || null}
                onSelect={handleAnswer}
              />
            </div>

            {error && (
              <p className="text-center text-sm text-destructive">{error}</p>
            )}

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={handleBack}
              >
                <ArrowLeft className="mr-2 size-4" />
                Back
              </Button>

              {isLastQuestion ? (
                <Button
                  size="lg"
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Getting Results...
                    </>
                  ) : (
                    <>
                      Get My Recommendations
                      <Sparkles className="ml-2 size-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Next
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Loading Screen */}
        {state === 'loading' && (
          <div className="py-16 text-center duration-300 animate-in fade-in-0">
            <Loader2 className="mx-auto mb-6 size-16 animate-spin text-primary" />
            <h2 className="mb-2 text-2xl font-semibold">
              Finding Your Perfect Products
            </h2>
            <p className="text-muted-foreground">
              Analyzing your preferences to curate personalized recommendations...
            </p>
          </div>
        )}

        {/* Results Screen */}
        {state === 'results' && results && (
          <div className="duration-500 animate-in fade-in-0 slide-in-from-bottom-4">
            <QuizResults
              visibleId={results.visibleId}
              products={results.products}
              onRetakeQuiz={handleRetakeQuiz}
              showShareButton={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
