import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const FEEDBACK_KEY = 'monad-feedback';
const HISTORY_KEY = 'monad-feedback-history';

// Migrate data to KV storage
export async function POST(request: NextRequest) {
  try {
    const { feedback: localFeedback, userHistory: localHistory } = await request.json();
    
    console.log('Migrating to KV:', { 
      feedbackCount: localFeedback?.length || 0, 
      historyCount: localHistory?.length || 0 
    });
    
    // Get existing KV data
    const existingFeedback = await kv.get(FEEDBACK_KEY) || [];
    const existingHistory = await kv.get(HISTORY_KEY) || [];
    
    // Merge with existing data (avoid duplicates by ID)
    if (localFeedback && Array.isArray(localFeedback)) {
      const existingIds = new Set((existingFeedback as any[]).map((f: any) => f.id));
      const newFeedback = localFeedback.filter((f: any) => !existingIds.has(f.id));
      
      if (newFeedback.length > 0) {
        const updatedFeedback = [...(existingFeedback as any[]), ...newFeedback];
        await kv.set(FEEDBACK_KEY, updatedFeedback);
      }
    }
    
    if (localHistory && Array.isArray(localHistory)) {
      const existingFeedbackIds = new Set((existingHistory as any[]).map((h: any) => h.feedbackId));
      const newHistory = localHistory.filter((h: any) => !existingFeedbackIds.has(h.feedbackId));
      
      if (newHistory.length > 0) {
        const updatedHistory = [...(existingHistory as any[]), ...newHistory];
        await kv.set(HISTORY_KEY, updatedHistory);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      migrated: {
        feedback: localFeedback?.length || 0,
        history: localHistory?.length || 0
      }
    });
  } catch (error) {
    console.error('Error migrating to KV:', error);
    return NextResponse.json({ error: 'Failed to migrate data' }, { status: 500 });
  }
} 