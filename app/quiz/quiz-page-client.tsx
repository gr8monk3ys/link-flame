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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12">
      <div className="container max-w-3xl px-4">
        {/* Intro Screen */}
        {state === 'intro' && (
          <div
            className={cn(
              'text-center space-y-8',
              'animate-in fade-in-0 slide-in-from-bottom-4 duration-500'
            )}
          >
            {/* Hero section */}
            <div className="space-y-4">
              <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Leaf className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                Find Your Perfect
                <br />
                <span className="text-primary">Eco-Friendly Products</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto">
                Answer a few quick questions about your lifestyle and preferences,
                and we&apos;ll recommend sustainable products tailored just for you.
              </p>
            </div>

            {/* How it works */}
            <div className="grid sm:grid-cols-3 gap-6 py-8 max-w-2xl mx-auto">
              <div className="flex flex-col items-center gap-3 p-4">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-xl font-semibold">
                  1
                </div>
                <h3 className="font-medium">Tell Us About You</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Share your sustainability goals and preferences
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 p-4">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-xl font-semibold">
                  2
                </div>
                <h3 className="font-medium">We Analyze</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Our algorithm finds products that match your needs
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 p-4">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-xl font-semibold">
                  3
                </div>
                <h3 className="font-medium">Get Recommendations</h3>
                <p className="text-sm text-muted-foreground text-center">
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
                className="px-12 py-6 text-lg gap-2"
              >
                {isLoadingQuestions ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Start Quiz
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                Takes less than 2 minutes - No account required
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive mt-4">{error}</p>
            )}
          </div>
        )}

        {/* Questions Screen */}
        {state === 'questions' && currentQuestion && (
          <div className="space-y-8 animate-in fade-in-0 duration-300">
            <QuizProgress
              currentStep={currentQuestionIndex + 1}
              totalSteps={questions.length}
            />

            <div className="bg-card border rounded-xl p-6 sm:p-8 shadow-sm">
              <QuizQuestion
                question={currentQuestion.question}
                options={currentQuestion.options}
                questionType={currentQuestion.questionType}
                selectedValue={answers[currentQuestion.visibleId] || null}
                onSelect={handleAnswer}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
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
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting Results...
                    </>
                  ) : (
                    <>
                      Get My Recommendations
                      <Sparkles className="w-4 h-4 ml-2" />
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
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Loading Screen */}
        {state === 'loading' && (
          <div className="py-16 text-center animate-in fade-in-0 duration-300">
            <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-6" />
            <h2 className="text-2xl font-semibold mb-2">
              Finding Your Perfect Products
            </h2>
            <p className="text-muted-foreground">
              Analyzing your preferences to curate personalized recommendations...
            </p>
          </div>
        )}

        {/* Results Screen */}
        {state === 'results' && results && (
          <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
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
