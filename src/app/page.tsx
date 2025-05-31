'use client';

import { useState } from 'react';
import Header from '@/components/header';
import FeedbackForm from '@/components/feedback-form';
import FeedbackHistory from '@/components/feedback-history';

export default function Home() {
  const [currentView, setCurrentView] = useState<'form' | 'history'>('form');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-purple-950 dark:via-slate-900 dark:to-purple-900">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      <main className="py-8">
        {currentView === 'form' ? <FeedbackForm /> : <FeedbackHistory />}
      </main>
    </div>
  );
}
