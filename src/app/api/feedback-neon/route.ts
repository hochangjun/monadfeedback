import { NextRequest, NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';

// Get feedback data from PostgreSQL
export async function GET() {
  try {
    // Ensure database is initialized
    await initDatabase();
    
    if (!sql) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }
    
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
    console.error('Error reading from database:', error);
    return NextResponse.json({ error: 'Failed to read feedback' }, { status: 500 });
  }
}

// Add new feedback to PostgreSQL
export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized
    await initDatabase();
    
    if (!sql) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }
    
    const { feedback: newFeedback, userHistory: newHistory } = await request.json();
    
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
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
} 