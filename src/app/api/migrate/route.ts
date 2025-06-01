import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');
const HISTORY_FILE = path.join(DATA_DIR, 'user-history.json');

// Ensure data directory exists
async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

// Migrate localStorage data to server
export async function POST(request: NextRequest) {
  try {
    await ensureDataDir();
    
    const { feedback: localFeedback, userHistory: localHistory } = await request.json();
    
    console.log('Migrating data:', { 
      feedbackCount: localFeedback?.length || 0, 
      historyCount: localHistory?.length || 0 
    });
    
    // Read existing server data
    let existingFeedback = [];
    let existingHistory = [];
    
    try {
      const feedbackData = await readFile(FEEDBACK_FILE, 'utf-8');
      existingFeedback = JSON.parse(feedbackData);
    } catch (error) {
      // File doesn't exist yet
    }
    
    try {
      const historyData = await readFile(HISTORY_FILE, 'utf-8');
      existingHistory = JSON.parse(historyData);
    } catch (error) {
      // File doesn't exist yet
    }
    
    // Merge with existing data (avoid duplicates by ID)
    if (localFeedback && Array.isArray(localFeedback)) {
      const existingIds = new Set(existingFeedback.map((f: any) => f.id));
      const newFeedback = localFeedback.filter((f: any) => !existingIds.has(f.id));
      existingFeedback = [...existingFeedback, ...newFeedback];
      await writeFile(FEEDBACK_FILE, JSON.stringify(existingFeedback, null, 2));
    }
    
    if (localHistory && Array.isArray(localHistory)) {
      const existingFeedbackIds = new Set(existingHistory.map((h: any) => h.feedbackId));
      const newHistory = localHistory.filter((h: any) => !existingFeedbackIds.has(h.feedbackId));
      existingHistory = [...existingHistory, ...newHistory];
      await writeFile(HISTORY_FILE, JSON.stringify(existingHistory, null, 2));
    }
    
    return NextResponse.json({ 
      success: true, 
      migrated: {
        feedback: localFeedback?.length || 0,
        history: localHistory?.length || 0
      }
    });
  } catch (error) {
    console.error('Error migrating data:', error);
    return NextResponse.json({ error: 'Failed to migrate data' }, { status: 500 });
  }
} 