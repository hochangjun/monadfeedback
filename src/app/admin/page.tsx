'use client';

import { useState, useEffect } from 'react';
import { Calendar, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeedbackEntry {
  feedback: string;
  category: string;
  xHandle?: string;
  timestamp: string;
  paymentAmount: string;
  id: string;
}

export default function AdminPage() {
  const [allFeedback, setAllFeedback] = useState<FeedbackEntry[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<FeedbackEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const categories = [
    'all',
    'speed_performance',
    'ease_of_use',
    'apps', 
    'ideas_requests',
    'community_support',
    'developer_experience',
    'other'
  ];

  useEffect(() => {
    loadAllFeedback();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredFeedback(allFeedback);
    } else {
      setFilteredFeedback(allFeedback.filter(f => f.category === selectedCategory));
    }
  }, [allFeedback, selectedCategory]);

  const loadAllFeedback = async () => {
    try {
      // First, try to migrate any existing localStorage data
      await migrateLocalData();
      
      // Load from server (Neon PostgreSQL for Vercel)
      const response = await fetch('/api/feedback-neon');
      if (response.ok) {
        const { feedback } = await response.json();
        
        // Convert legacy format to new format if needed
        const normalizedFeedback = feedback.map((item: any) => ({
          ...item,
          id: item.id || `legacy-${Date.now()}-${Math.random()}`, // Generate ID for legacy entries
        }));
        
        // Sort by timestamp (newest first)
        normalizedFeedback.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAllFeedback(normalizedFeedback);
        setFilteredFeedback(normalizedFeedback);
      } else {
        console.error('Failed to load feedback from server');
        // Fallback to localStorage
        loadLocalFeedback();
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
      // Fallback to localStorage
      loadLocalFeedback();
    } finally {
      setLoading(false);
    }
  };

  const migrateLocalData = async () => {
    try {
      const localFeedback = localStorage.getItem('monad-feedback');
      const localHistory = localStorage.getItem('user-submission-history');
      
      if (localFeedback || localHistory) {
        const response = await fetch('/api/migrate-neon', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feedback: localFeedback ? JSON.parse(localFeedback) : [],
            userHistory: localHistory ? JSON.parse(localHistory) : []
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Migration successful:', result);
        }
      }
    } catch (error) {
      console.error('Migration failed:', error);
    }
  };

  const loadLocalFeedback = () => {
    try {
      const storedFeedback = localStorage.getItem('monad-feedback');
      if (storedFeedback) {
        const feedback: FeedbackEntry[] = JSON.parse(storedFeedback);
        
        // Convert legacy format to new format if needed
        const normalizedFeedback = feedback.map(item => ({
          ...item,
          id: item.id || `legacy-${Date.now()}-${Math.random()}`, // Generate ID for legacy entries
        }));
        
        // Sort by timestamp (newest first)
        normalizedFeedback.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAllFeedback(normalizedFeedback);
        setFilteredFeedback(normalizedFeedback);
      }
    } catch (error) {
      console.error('Error loading local feedback:', error);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCategory = (category: string) => {
    if (!category) return 'General';
    return category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ');
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Category', 'X Handle', 'Feedback', 'Payment Amount', 'Feedback ID'];
    const csvContent = [
      headers.join(','),
      ...filteredFeedback.map(feedback => [
        `"${formatDate(feedback.timestamp)}"`,
        `"${formatCategory(feedback.category)}"`,
        `"${feedback.xHandle ? '@' + feedback.xHandle : ''}"`,
        `"${feedback.feedback.replace(/"/g, '""')}"`,
        feedback.paymentAmount,
        feedback.id ? feedback.id.slice(0, 8) : 'legacy'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monad-feedback-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-purple-900 flex items-center justify-center">
        <div className="animate-pulse text-white">Loading feedback data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-purple-900">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold font-mono mb-4 text-white">
            FEEDBACK
            <span className="text-purple-400"> ADMIN</span>
          </h1>
          <p className="text-xl text-gray-300 font-mono max-w-2xl mx-auto">
            View all submitted Monad Testnet feedback
          </p>
        </div>

        {/* Stats & Controls */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-6">
              <div className="text-white">
                <span className="text-2xl font-bold">{filteredFeedback.length}</span>
                <p className="text-sm text-gray-300">
                  {selectedCategory === 'all' ? 'Total Submissions' : 'Filtered Results'}
                </p>
              </div>
              <div className="text-white">
                <span className="text-2xl font-bold">{allFeedback.length * 5}</span>
                <p className="text-sm text-gray-300">Total MON Collected</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-300" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-purple-800/50 text-white rounded px-3 py-2 text-sm border border-purple-600"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : formatCategory(category)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Export Button */}
              <Button 
                onClick={exportToCSV}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Feedback List */}
        {filteredFeedback.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8">
              <p className="text-xl text-gray-300 mb-4">No feedback found</p>
              <p className="text-gray-400">
                {selectedCategory === 'all' 
                  ? 'No feedback has been submitted yet.' 
                  : `No feedback found for category: ${formatCategory(selectedCategory)}`
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredFeedback.map((feedback, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-purple-500/20"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {formatCategory(feedback.category)}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-300">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(feedback.timestamp)}</span>
                      </div>
                      {feedback.xHandle && (
                        <>
                          <span>•</span>
                          <span className="text-purple-400">@{feedback.xHandle}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Payment: {feedback.paymentAmount} MON</span>
                      <span>•</span>
                      <span>ID: {feedback.id ? feedback.id.slice(0, 8) : 'legacy'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-black/20 rounded-lg p-4">
                  <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {feedback.feedback}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 