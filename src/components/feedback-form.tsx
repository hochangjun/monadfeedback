'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { FEEDBACK_COST_MON } from '@/lib/config';
import { AlertCircle, CheckCircle2, Loader2, Shield, Zap } from 'lucide-react';
import { makePayment, getContractAddress, type PaymentResult, checkPaymentStatus } from '@/lib/contract';

const categories = [
  {
    id: 'speed_performance',
    label: 'Speed & Performance',
    description: 'Block times, transaction speeds, network latency',
    icon: '⚡'
  },
  {
    id: 'ease_of_use',
    label: 'Ease of Use',
    description: 'User experience, interface design, onboarding',
    icon: '🎯'
  },
  {
    id: 'apps',
    label: 'Apps & DApps',
    description: 'Decentralized applications, smart contracts, app functionality',
    icon: '📱'
  },
  {
    id: 'ideas_requests',
    label: 'Ideas & Requests',
    description: 'Feature suggestions, improvements, new concepts',
    icon: '💡'
  },
  {
    id: 'community_support',
    label: 'Community & Official Support',
    description: 'Documentation, help resources, community engagement',
    icon: '🤝'
  },
  {
    id: 'developer_experience',
    label: 'Developer Experience',
    description: 'APIs, SDKs, tools, development workflow',
    icon: '⚙️'
  },
  {
    id: 'other',
    label: 'Other',
    description: 'General feedback, suggestions, or anything else',
    icon: '📝'
  }
];

export default function FeedbackForm() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [feedback, setFeedback] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showMigrationNotice, setShowMigrationNotice] = useState(false);

  const connectedWallet = wallets.find(wallet => wallet.address);

  // Format countdown time
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check payment status and migration on wallet connect
  useEffect(() => {
    const checkPayment = async () => {
      if (connectedWallet?.address) {
        try {
          const provider = await connectedWallet.getEthereumProvider();
          const paid = await checkPaymentStatus(provider, connectedWallet.address);
          setHasPaid(paid);
        } catch (error) {
          console.error('Error checking payment status:', error);
        }
      }
    };

    const checkMigration = () => {
      const localFeedback = localStorage.getItem('monad-feedback');
      const localHistory = localStorage.getItem('user-submission-history');
      if ((localFeedback && JSON.parse(localFeedback).length > 0) || 
          (localHistory && JSON.parse(localHistory).length > 0)) {
        setShowMigrationNotice(true);
      }
    };

    checkPayment();
    checkMigration();
  }, [connectedWallet]);



  const handlePayment = async () => {
    if (!connectedWallet) {
      setStatusMessage('Please connect your wallet first');
      return;
    }

    const contractAddress = getContractAddress();
    if (!contractAddress) {
      setStatusMessage('Smart contract not deployed yet. Please deploy the contract first.');
      return;
    }

    setIsPaymentLoading(true);
    setStatusMessage('');

    try {
      setStatusMessage('Initiating payment transaction...');
      
      // Use the specific connected wallet's provider to avoid wallet conflicts
      await connectedWallet.switchChain(10143); // Switch to Monad Testnet
      const provider = await connectedWallet.getEthereumProvider();
      const result: PaymentResult = await makePayment(provider);
      
      if (result.success) {
        setStatusMessage(`Payment successful! Transaction: ${result.transactionHash?.slice(0, 10)}...`);
        setHasPaid(true);
      } else {
        setStatusMessage(`Payment failed: ${result.error}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setStatusMessage(`Payment failed: ${errorMsg}`);
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!feedback.trim() || !selectedCategory) return;

    setIsSubmitLoading(true);
    setSubmitStatus('idle');
    setStatusMessage('');

    try {
      // Add random delay (30s-5min) to break time correlation with payment
      const randomDelay = 30000 + Math.random() * 270000; // 30s to 5min
      
      // Start countdown
      setCountdown(Math.ceil(randomDelay / 1000)); // Convert to seconds
      setStatusMessage('🔒 Anonymizing submission for privacy protection...');
      
      // Countdown timer
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev && prev > 1) {
            return prev - 1;
          } else {
            clearInterval(countdownInterval);
            return null;
          }
        });
      }, 1000);
      
      await new Promise(resolve => setTimeout(resolve, randomDelay));
      
      setStatusMessage('✅ Finalizing anonymous submission...');
      
      // TRUE ANONYMITY: Store feedback WITHOUT wallet address
      // Generate random timestamp between 2022 and now for anonymity
      const randomTimestamp = new Date(
        2022 + Math.random() * (new Date().getFullYear() - 2022),
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1,
        Math.floor(Math.random() * 24),
        Math.floor(Math.random() * 60),
        Math.floor(Math.random() * 60)
      ).toISOString();
      
      const feedbackData = {
        feedback: feedback.trim(),
        category: selectedCategory,
        xHandle: xHandle.trim() || null, // Optional X handle (publicly shown if provided)
        timestamp: randomTimestamp, // Randomized timestamp for anonymity
        paymentAmount: FEEDBACK_COST_MON,
        id: crypto.randomUUID(), // Random UUID (already anonymous)
      };
      
      // Track user's submissions separately (for history view)
      const userHistory = {
        feedbackId: feedbackData.id,
        category: selectedCategory,
        timestamp: feedbackData.timestamp, // Use same random timestamp
        walletAddress: connectedWallet?.address,
      };
      
      // Save to server (shared across all devices) - Neon PostgreSQL for Vercel
      const response = await fetch('/api/feedback-neon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: feedbackData,
          userHistory: userHistory
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save feedback to server');
      }
      
      // Also keep in localStorage as backup
      const existingFeedback = JSON.parse(localStorage.getItem('monad-feedback') || '[]');
      existingFeedback.push(feedbackData);
      localStorage.setItem('monad-feedback', JSON.stringify(existingFeedback));
      
      const existingHistory = JSON.parse(localStorage.getItem('user-submission-history') || '[]');
      existingHistory.push(userHistory);
      localStorage.setItem('user-submission-history', JSON.stringify(existingHistory));
      
      setShowSuccessModal(true);
      setFeedback('');
      setSelectedCategory('');
      setXHandle('');
      setSubmitStatus('success');
      setCountdown(null);
      
    } catch (error) {
      setSubmitStatus('error');
      setStatusMessage(`Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setCountdown(null);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const isFormEnabled = authenticated && hasPaid;
  const canSubmit = isFormEnabled && feedback.trim() && feedback.length <= 1000 && selectedCategory && !isSubmitLoading;

  if (!authenticated) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
          <AlertCircle className="h-12 w-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Wallet Connection Required
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Please connect your wallet to submit feedback. A payment of {FEEDBACK_COST_MON} MON is required to prevent spam.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 py-12 pb-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold font-mono mb-4">
            MONAD
            <span className="text-muted-foreground"> FEEDBACK</span>
          </h1>
          <p className="text-xl text-muted-foreground font-mono max-w-2xl mx-auto">
            Share your thoughts about Monad Testnet apps. Pay once, choose to submit <b>anonymously</b> or <b>publicly</b>.
          </p>
        </div>

        {/* Privacy Badges */}
        <div className="flex justify-center gap-4 mb-12">
          <div className="flex items-center gap-2 py-2 px-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-full">
            <Shield className="h-4 w-4" />
            <span className="text-sm">Fully Anonymous</span>
          </div>
          <div className="flex items-center gap-2 py-2 px-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-full">
            <Zap className="h-4 w-4" />
            <span className="text-sm">Spam Protected</span>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="max-w-2xl mx-auto bg-white dark:bg-purple-950/20 rounded-lg shadow-lg border border-gray-200 dark:border-purple-800">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
              Submit Feedback
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {!hasPaid && `Pay ${FEEDBACK_COST_MON} MON to prevent spam and enable anonymous feedback. Your address will not be associated with your feedback.`}
              {hasPaid && "Your address will not be associated with your feedback. Your feedback will be encrypted and anonymized."}
            </p>
            {getContractAddress() && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Contract: {getContractAddress()?.slice(0, 10)}...{getContractAddress()?.slice(-8)}
              </p>
            )}
          </div>

          <div className="p-6 space-y-6">
            {/* Migration Notice */}
            {showMigrationNotice && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                    <span className="text-sm text-blue-800 dark:text-blue-200 font-semibold">
                      Data Migration Available
                    </span>
                  </div>
                  <Button
                    onClick={() => setShowMigrationNotice(false)}
                    variant="ghost"
                    size="sm"
                  >
                    Dismiss
                  </Button>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                  We've upgraded to a shared feedback system! Your existing feedback will be automatically migrated to the new system when you visit the admin page or submit new feedback.
                </p>
              </div>
            )}

            {/* Payment Status */}
            {!hasPaid && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                    <span className="text-sm text-yellow-800 dark:text-yellow-200">
                      Payment required: {FEEDBACK_COST_MON} MON
                    </span>
                  </div>
                  <Button
                    onClick={handlePayment}
                    disabled={isPaymentLoading}
                    size="sm"
                  >
                    {isPaymentLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Pay Now'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {hasPaid && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                  <span className="text-sm text-green-800 dark:text-green-200">
                    Payment verified! You can now submit anonymous feedback.
                  </span>
                </div>
              </div>
            )}

            {/* Category Selection */}
            <div className="space-y-3">
              <label className="text-sm font-mono font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={!isFormEnabled}
              >
                <option value="">Select feedback category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.label} - {category.description}
                  </option>
                ))}
              </Select>
            </div>

            {/* Optional X Handle */}
            <div className="space-y-3">
              <label className="text-sm font-mono font-medium text-gray-700 dark:text-gray-300">
                X Handle <span className="text-xs text-gray-500 dark:text-gray-400">(Optional - publicly shown)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-mono text-sm pointer-events-none">
                  @
                </div>
                <input
                  type="text"
                  placeholder="your_handle (without @)"
                  value={xHandle}
                  onChange={(e) => setXHandle(e.target.value.replace(/^@/, ''))} // Remove @ if user types it
                  disabled={!isFormEnabled}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
                  maxLength={15}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                🔗 If provided, your X handle will be shown publicly with your feedback for attribution. Leave blank to remain completely anonymous.
              </p>
            </div>

            {/* Feedback Textarea */}
            <div className="space-y-3">
              <label className="text-sm font-mono font-medium text-gray-700 dark:text-gray-300">
                Your Feedback
              </label>
              <Textarea
                placeholder="Share your honest thoughts about Monad Testnet or its apps. What's working well? What could be improved? Your feedback will be completely anonymous."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={!isFormEnabled}
                rows={6}
                className="resize-none"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                <span className={`${feedback.length > 1000 ? "text-red-500" : ""}`}>
                  {feedback.length}
                </span>
                /1000 characters
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full font-mono"
              size="lg"
            >
              {isSubmitLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Anonymizing...
                </>
              ) : (
                `Submit Anonymous Feedback (${FEEDBACK_COST_MON} MON)`
              )}
            </Button>

            {/* Status Message */}
            {statusMessage && (
              <div className={`p-4 rounded-md ${
                submitStatus === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                  : countdown !== null
                  ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {submitStatus === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                    ) : countdown !== null ? (
                      <Loader2 className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2 animate-spin" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                    )}
                    <p className={`text-sm ${
                      submitStatus === 'success' 
                        ? 'text-green-800 dark:text-green-200' 
                        : countdown !== null
                        ? 'text-purple-800 dark:text-purple-200'
                        : 'text-red-800 dark:text-red-200'
                    }`}>
                      {statusMessage}
                    </p>
                  </div>
                  {countdown !== null && (
                    <div className="text-right">
                      <div className="text-2xl font-mono font-bold text-purple-600 dark:text-purple-400">
                        {formatCountdown(countdown)}
                      </div>
                      <div className="text-xs text-purple-500 dark:text-purple-400">
                        remaining
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Privacy Notice */}
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="font-mono">🔒 PRIVACY GUARANTEED</p>
              <p>
                Your feedback is encrypted and shuffled with others.
                No correlation between your wallet and feedback content.
              </p>
              <p className="text-purple-600 dark:text-purple-400 font-medium">
                ⏱️ Submissions are delayed 30s-5min to prevent timing correlation attacks
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-purple-950/90 rounded-lg p-8 max-w-md mx-4">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold font-mono text-gray-900 dark:text-white">Thank You!</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Feedback submitted successfully! Thank you for helping improve Monad Testnet.
              </p>
              <Button
                onClick={() => setShowSuccessModal(false)}
                className="font-mono"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 