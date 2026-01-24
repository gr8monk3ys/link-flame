import { Metadata } from 'next';
import { QuizPageClient } from './quiz-page-client';

export const metadata: Metadata = {
  title: 'Product Quiz | Find Your Perfect Eco-Friendly Products',
  description:
    'Take our quick quiz to discover sustainable products tailored to your lifestyle and preferences. Get personalized recommendations in less than 2 minutes.',
  openGraph: {
    title: 'Product Quiz - Link Flame',
    description:
      'Discover eco-friendly products tailored to your lifestyle. Take our 2-minute quiz for personalized recommendations.',
    type: 'website',
  },
};

export default function QuizPage() {
  return <QuizPageClient />;
}
