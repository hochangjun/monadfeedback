'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';

import { Calendar, Star, ExternalLink, AlertCircle } from 'lucide-react';

interface FeedbackEntry {
  feedback: string;
  category: string;
  xHandle?: string;
  timestamp: string;
  paymentAmount: string;
  id: string;
}

interface UserHistory {
  feedbackId: string;
  category: string;
  timestamp: string;
  walletAddress: string;
}

export default function FeedbackHistory() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const connectedWallet = wallets.find(wallet => wallet.address);

  const loadFeedbackHistory = useCallback(async () => {
    try {
      if (!connectedWallet?.address) {
        setLoading(false);
        return;
      }

      // Try to load from server first (Neon PostgreSQL for Vercel)
      const response = await fetch('/api/feedback-neon');
      if (response.ok) {
        const { feedback: allFeedback, userHistory: serverUserHistory } = await response.json();
        
        if (allFeedback && connectedWallet?.address) {
          let userFeedback: FeedbackEntry[] = [];
          
          // Check server user history first
          if (serverUserHistory && serverUserHistory.length > 0) {
            const userFeedbackIds = serverUserHistory
              .filter((submission: UserHistory) => submission.walletAddress.toLowerCase() === connectedWallet.address.toLowerCase())
              .map((submission: UserHistory) => submission.feedbackId);
            
            userFeedback = allFeedback.filter((feedback: FeedbackEntry) => 
              feedback.id && userFeedbackIds.includes(feedback.id)
            );
          }
          
          // Fallback to localStorage for any missing data
          const localUserHistory = localStorage.getItem('user-submission-history');
          if (localUserHistory && userFeedback.length === 0) {
            const userSubmissions: UserHistory[] = JSON.parse(localUserHistory);
            const userFeedbackIds = userSubmissions
              .filter(submission => submission.walletAddress.toLowerCase() === connectedWallet.address.toLowerCase())
              .map(submission => submission.feedbackId);
            
            userFeedback = allFeedback.filter((feedback: FeedbackEntry) => 
              feedback.id && userFeedbackIds.includes(feedback.id)
            );
          }
          
          // Sort by timestamp (newest first)
          userFeedback.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setFeedbackHistory(userFeedback);
        }
      } else {
        // Fallback to localStorage
        loadLocalFeedbackHistory();
      }
    } catch (error) {
      console.error('Error loading feedback history:', error);
      // Fallback to localStorage
      loadLocalFeedbackHistory();
    } finally {
      setLoading(false);
    }
  }, [connectedWallet]);

  const loadLocalFeedbackHistory = () => {
    try {
      // Load user's submission history (new format)
      const userHistory = localStorage.getItem('user-submission-history');
      const allFeedback = localStorage.getItem('monad-feedback');
      
      if (allFeedback && connectedWallet?.address) {
        const feedbackEntries: (FeedbackEntry & {walletAddress?: string})[] = JSON.parse(allFeedback);
        let userFeedback: FeedbackEntry[] = [];
        
        if (userHistory) {
          // New anonymous format
          const userSubmissions: UserHistory[] = JSON.parse(userHistory);
          const userFeedbackIds = userSubmissions
            .filter(submission => submission.walletAddress.toLowerCase() === connectedWallet.address.toLowerCase())
            .map(submission => submission.feedbackId);
          
          userFeedback = feedbackEntries.filter(feedback => 
            feedback.id && userFeedbackIds.includes(feedback.id)
          );
        } else {
          // Legacy format - fallback for old data
          userFeedback = feedbackEntries.filter(feedback => 
            feedback.walletAddress && 
            feedback.walletAddress.toLowerCase() === connectedWallet.address.toLowerCase()
          );
        }
        
        // Sort by timestamp (newest first)
        userFeedback.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setFeedbackHistory(userFeedback);
      }
    } catch (error) {
      console.error('Error loading local feedback history:', error);
    }
  };

  useEffect(() => {
    if (authenticated && connectedWallet) {
      loadFeedbackHistory();
    } else {
      setLoading(false);
    }
  }, [authenticated, connectedWallet, loadFeedbackHistory]);

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };



  if (!authenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
          <AlertCircle className="h-12 w-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Wallet Connection Required
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Please connect your wallet to view your feedback history.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Your Feedback History
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          View all the feedback you've submitted for Monad Testnet applications.
        </p>
      </div>

      {feedbackHistory.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 dark:bg-purple-950/20 rounded-lg p-8">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Feedback Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              You haven&apos;t submitted any feedback yet. Share your thoughts on Monad Testnet applications!
            </p>
            <Button onClick={() => window.location.reload()}>
                              Submit Your First Feedback
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {feedbackHistory.map((feedback, index) => (
            <div
              key={index}
              className="bg-white dark:bg-purple-950/20 rounded-lg shadow-lg border border-gray-200 dark:border-purple-800 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {feedback.category ? 
                        feedback.category.charAt(0).toUpperCase() + feedback.category.slice(1).replace('_', ' ') : 
                        'General Feedback'
                      }
                    </h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(feedback.timestamp)}</span>
                      </div>
                      {feedback.xHandle && (
                        <div className="flex items-center space-x-1">
                          <span className="text-purple-600 dark:text-purple-400">@{feedback.xHandle}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Payment: {feedback.paymentAmount} MON
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      Feedback
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                      {feedback.feedback}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                      <span>Anonymous feedback</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ExternalLink className="h-3 w-3" />
                      <span>Feedback ID: {feedback.id ? feedback.id.slice(0, 8) : 'legacy'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 