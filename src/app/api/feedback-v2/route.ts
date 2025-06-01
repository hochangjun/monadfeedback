import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const FEEDBACK_KEY = 'monad-feedback';
const HISTORY_KEY = 'monad-feedback-history';

// Get feedback data from KV
export async function GET() {
  try {
    const feedback = await kv.get(FEEDBACK_KEY) || [];
    const userHistory = await kv.get(HISTORY_KEY) || [];
    
    return NextResponse.json({ feedback, userHistory });
  } catch (error) {
    console.error('Error reading from KV:', error);
    return NextResponse.json({ error: 'Failed to read feedback' }, { status: 500 });
  }
}

// Add new feedback to KV
export async function POST(request: NextRequest) {
  try {
    const { feedback: newFeedback, userHistory: newHistory } = await request.json();
    
    // Get existing data
    const existingFeedback = await kv.get(FEEDBACK_KEY) || [];
    const existingHistory = await kv.get(HISTORY_KEY) || [];
    
    // Add new feedback and history
    if (newFeedback) {
      const updatedFeedback = [...(existingFeedback as any[]), newFeedback];
      await kv.set(FEEDBACK_KEY, updatedFeedback);
    }
    
    if (newHistory) {
      const updatedHistory = [...(existingHistory as any[]), newHistory];
      await kv.set(HISTORY_KEY, updatedHistory);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving to KV:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
} 