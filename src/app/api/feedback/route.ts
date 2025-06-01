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

// Get feedback data
export async function GET() {
  try {
    await ensureDataDir();
    
    let feedback = [];
    let userHistory = [];
    
    try {
      const feedbackData = await readFile(FEEDBACK_FILE, 'utf-8');
      feedback = JSON.parse(feedbackData);
    } catch (error) {
      // File doesn't exist yet, start with empty array
      feedback = [];
    }
    
    try {
      const historyData = await readFile(HISTORY_FILE, 'utf-8');
      userHistory = JSON.parse(historyData);
    } catch (error) {
      // File doesn't exist yet, start with empty array
      userHistory = [];
    }
    
    return NextResponse.json({ feedback, userHistory });
  } catch (error) {
    console.error('Error reading feedback:', error);
    return NextResponse.json({ error: 'Failed to read feedback' }, { status: 500 });
  }
}

// Add new feedback
export async function POST(request: NextRequest) {
  try {
    await ensureDataDir();
    
    const { feedback: newFeedback, userHistory: newHistory } = await request.json();
    
    // Read existing data
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
    
    // Add new feedback and history
    if (newFeedback) {
      existingFeedback.push(newFeedback);
      await writeFile(FEEDBACK_FILE, JSON.stringify(existingFeedback, null, 2));
    }
    
    if (newHistory) {
      existingHistory.push(newHistory);
      await writeFile(HISTORY_FILE, JSON.stringify(existingHistory, null, 2));
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
} 