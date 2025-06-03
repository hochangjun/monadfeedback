import { NextRequest, NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';

// Get feedback data from PostgreSQL
export async function GET() {
  try {
    // Check if database is available
    if (!sql) {
      return NextResponse.json({ 
        feedback: [], 
        userHistory: [],
        note: 'Database not configured - using localStorage fallback' 
      });
    }
    
    // Ensure database is initialized
    await initDatabase();
    
    // Get all feedback (anonymous)
    const feedback = await sql`
      SELECT 
        id,
        feedback_text as feedback,
        category,
        x_handle as "xHandle",
        payment_amount as "paymentAmount",
        anonymous_timestamp as timestamp
      FROM feedback 
      ORDER BY anonymous_timestamp DESC
    `;
    
    // Get user history (separate from feedback for anonymity)
    const userHistory = await sql`
      SELECT 
        feedback_id as "feedbackId",
        wallet_address as "walletAddress",
        category,
        anonymous_timestamp as timestamp
      FROM user_history 
      ORDER BY anonymous_timestamp DESC
    `;
    
    return NextResponse.json({ feedback, userHistory });
  } catch (error) {
    console.error('Database error details:', error);
    // Return more specific error information
    return NextResponse.json({ 
      error: 'Database query failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      hasDatabase: !!sql
    }, { status: 500 });
  }
}

// Add new feedback to PostgreSQL
export async function POST(request: NextRequest) {
  try {
    const { feedback: newFeedback, userHistory: newHistory } = await request.json();
    
    // Check if database is available
    if (!sql) {
      console.log('Database not available, feedback will be saved to localStorage only');
      return NextResponse.json({ 
        success: true, 
        note: 'Saved to localStorage - configure DATABASE_URL for persistent storage',
        fallback: true
      });
    }
    
    // Ensure database is initialized
    await initDatabase();
    
    if (newFeedback) {
      // Insert feedback
      const result = await sql`
        INSERT INTO feedback (
          feedback_text, 
          category,
          x_handle,
          payment_amount, 
          anonymous_timestamp
        ) 
        VALUES (
          ${newFeedback.feedback},
          ${newFeedback.category},
          ${newFeedback.xHandle || null},
          ${newFeedback.paymentAmount},
          ${newFeedback.timestamp}
        )
        RETURNING id
      `;
      
      const feedbackId = result[0].id;
      
      // Insert user history with the same feedback ID
      if (newHistory) {
        await sql`
          INSERT INTO user_history (
            feedback_id,
            wallet_address,
            category,
            anonymous_timestamp
          )
          VALUES (
            ${feedbackId},
            ${newHistory.walletAddress},
            ${newHistory.category},
            ${newHistory.timestamp}
          )
        `;
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving to database:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save feedback to database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 