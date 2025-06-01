import { NextRequest, NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';

// Migrate data to Neon PostgreSQL
export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized
    await initDatabase();
    
    const { feedback: localFeedback, userHistory: localHistory } = await request.json();
    
    console.log('Migrating to Neon PostgreSQL:', { 
      feedbackCount: localFeedback?.length || 0, 
      historyCount: localHistory?.length || 0 
    });
    
    let migratedFeedback = 0;
    let migratedHistory = 0;
    
    // Migrate feedback data
    if (localFeedback && Array.isArray(localFeedback)) {
      for (const feedback of localFeedback) {
        try {
          console.log('Migrating feedback item:', feedback);
          // Check if feedback already exists
          const existing = await sql`
            SELECT id FROM feedback 
            WHERE feedback_text = ${feedback.feedback} 
            AND category = ${feedback.category}
            AND anonymous_timestamp = ${feedback.timestamp}
          `;
          
          if (existing.length === 0) {
            await sql`
              INSERT INTO feedback (
                feedback_text, 
                category, 
                payment_amount, 
                anonymous_timestamp
              ) 
              VALUES (
                ${feedback.feedback || feedback.feedback_text || 'No feedback text'},
                ${feedback.category || 'other'},
                ${feedback.paymentAmount || feedback.payment_amount || '5 MON'},
                ${feedback.timestamp || new Date().toISOString()}
              )
            `;
            migratedFeedback++;
          }
        } catch (error) {
          console.error('Error migrating feedback:', error);
        }
      }
    }
    
    // Migrate user history data
    if (localHistory && Array.isArray(localHistory)) {
      for (const history of localHistory) {
        try {
          // Find the corresponding feedback ID
          const feedbackResult = await sql`
            SELECT id FROM feedback 
            WHERE category = ${history.category}
            AND anonymous_timestamp = ${history.timestamp}
            LIMIT 1
          `;
          
          if (feedbackResult.length > 0) {
            const feedbackId = feedbackResult[0].id;
            
            // Check if history already exists
            const existingHistory = await sql`
              SELECT id FROM user_history 
              WHERE feedback_id = ${feedbackId}
              AND wallet_address = ${history.walletAddress}
            `;
            
            if (existingHistory.length === 0) {
              await sql`
                INSERT INTO user_history (
                  feedback_id,
                  wallet_address,
                  category,
                  anonymous_timestamp
                )
                VALUES (
                  ${feedbackId},
                  ${history.walletAddress},
                  ${history.category},
                  ${history.timestamp}
                )
              `;
              migratedHistory++;
            }
          }
        } catch (error) {
          console.error('Error migrating history:', error);
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      migrated: {
        feedback: migratedFeedback,
        history: migratedHistory
      }
    });
  } catch (error) {
    console.error('Error migrating to PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to migrate data' }, { status: 500 });
  }
} 