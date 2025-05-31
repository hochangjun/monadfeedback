'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { PROJECT_OPTIONS, RATING_OPTIONS, FEEDBACK_COST_MON } from '@/lib/config';
import { Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { makePayment, getContractAddress, type PaymentResult } from '@/lib/contract';

interface FeedbackFormData {
  projectName: string;
  features: string;
  workedWell: string;
  didntWork: string;
  improvements: string;
  rating: number;
  additional: string;
}

const initialFormData: FeedbackFormData = {
  projectName: '',
  features: '',
  workedWell: '',
  didntWork: '',
  improvements: '',
  rating: 3,
  additional: '',
};

export default function FeedbackForm() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [formData, setFormData] = useState<FeedbackFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const connectedWallet = wallets.find(wallet => wallet.address);

  const handleInputChange = (field: keyof FeedbackFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.projectName) errors.push('Project name is required');
    if (!formData.features) errors.push('Features/flows field is required');
    
    return errors;
  };

  const handlePayment = async (): Promise<boolean> => {
    if (!connectedWallet) {
      setStatusMessage('Please connect your wallet first');
      return false;
    }

    const contractAddress = getContractAddress();
    if (!contractAddress) {
      setStatusMessage('Smart contract not deployed yet. Please deploy the contract first.');
      return false;
    }

    try {
      setStatusMessage('Initiating payment transaction...');
      
      // Get the wallet's provider
      const provider = await connectedWallet.getEthereumProvider();
      
      // Make the payment through the smart contract
      const result: PaymentResult = await makePayment(provider);
      
      if (result.success) {
        setStatusMessage(`Payment successful! Transaction: ${result.transactionHash?.slice(0, 10)}...`);
        return true;
      } else {
        setStatusMessage(`Payment failed: ${result.error}`);
        return false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setStatusMessage(`Payment failed: ${errorMsg}`);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authenticated || !connectedWallet) {
      setStatusMessage('Please connect your wallet to submit feedback');
      setSubmitStatus('error');
      return;
    }

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setStatusMessage(validationErrors.join(', '));
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setStatusMessage('');

    try {
      // Step 1: Process payment
      const paymentSuccess = await handlePayment();
      if (!paymentSuccess) {
        setSubmitStatus('error');
        return;
      }

      // Step 2: Submit feedback
      setStatusMessage('Submitting feedback...');
      
      // In a real implementation, you would send this to your backend
      const feedbackData = {
        ...formData,
        walletAddress: connectedWallet.address,
        timestamp: new Date().toISOString(),
        paymentAmount: FEEDBACK_COST_MON,
        paymentStatus: 'simulated', // Note: payment is currently simulated
      };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Store in localStorage for demo (in real app, send to backend)
      const existingFeedback = JSON.parse(localStorage.getItem('monad-feedback') || '[]');
      existingFeedback.push(feedbackData);
      localStorage.setItem('monad-feedback', JSON.stringify(existingFeedback));
      
      setSubmitStatus('success');
      setStatusMessage('Feedback submitted successfully! Thank you for your input.');
      setFormData(initialFormData);
      
    } catch (error) {
      setSubmitStatus('error');
      setStatusMessage(`Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white dark:bg-purple-950/20 rounded-lg shadow-lg border border-gray-200 dark:border-purple-800">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            App Feedback Form - Monad Testnet
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Tried an application on Monad Testnet? Share your feedback with the team building it. 
            Your input helps shape better products.
          </p>
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> A payment of {FEEDBACK_COST_MON} MON is required to submit feedback to prevent spam.
            </p>
            {getContractAddress() && (
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Contract: {getContractAddress()?.slice(0, 10)}...{getContractAddress()?.slice(-8)}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Name *
            </label>
            <Select
              value={formData.projectName}
              onChange={(e) => handleInputChange('projectName', e.target.value)}
              required
            >
              <option value="">Select the application you'd like to share feedback on</option>
              {PROJECT_OPTIONS.map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </Select>
          </div>

          {/* Features */}
          <div>
            <label htmlFor="features" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What feature(s) or flows did you try? *
            </label>
            <Textarea
              value={formData.features}
              onChange={(e) => handleInputChange('features', e.target.value)}
              placeholder='e.g., "swap flow", "login/signup", "create a vault", "minting NFTs"'
              required
              className="min-h-[80px]"
            />
          </div>

          {/* What worked well */}
          <div>
            <label htmlFor="workedWell" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What worked well?
            </label>
            <Textarea
              value={formData.workedWell}
              onChange={(e) => handleInputChange('workedWell', e.target.value)}
              placeholder="Share what you liked about the experience..."
              className="min-h-[80px]"
            />
          </div>

          {/* What didn't work */}
          <div>
            <label htmlFor="didntWork" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What didn't work or felt confusing?
            </label>
            <Textarea
              value={formData.didntWork}
              onChange={(e) => handleInputChange('didntWork', e.target.value)}
              placeholder="Describe any issues or confusing parts..."
              className="min-h-[80px]"
            />
          </div>

          {/* Improvements */}
          <div>
            <label htmlFor="improvements" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              How would you improve it?
            </label>
            <Textarea
              value={formData.improvements}
              onChange={(e) => handleInputChange('improvements', e.target.value)}
              placeholder="Suggest improvements or new features..."
              className="min-h-[80px]"
            />
          </div>



          {/* Rating */}
          <div>
            <label htmlFor="rating" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Overall project rating
            </label>
            <div className="flex space-x-2">
              {RATING_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleInputChange('rating', option.value)}
                                     className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                     formData.rating === option.value
                       ? 'bg-purple-600 text-white'
                       : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-800/40'
                   }`}
                >
                  {option.value}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Unusable</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Additional */}
          <div>
            <label htmlFor="additional" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Anything else you want to share?
            </label>
            <Textarea
              value={formData.additional}
              onChange={(e) => handleInputChange('additional', e.target.value)}
              placeholder="Any other thoughts or suggestions..."
              className="min-h-[80px]"
            />
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className={`p-4 rounded-md ${
              submitStatus === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center">
                {submitStatus === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                )}
                <p className={`text-sm ${
                  submitStatus === 'success' 
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {statusMessage}
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || !authenticated}
            className="w-full flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit Feedback ({FEEDBACK_COST_MON} MON)</span>
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
} 