import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    if (!sql) {
      return NextResponse.json({ error: 'No database' });
    }

    // Simple test query
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
      LIMIT 5
    `;
    
    return NextResponse.json({ 
      success: true, 
      count: feedback.length,
      sample: feedback.slice(0, 2).map(f => ({
        id: f.id,
        category: f.category,
        xHandle: f.xHandle,
        timestamp: f.timestamp
      }))
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    });
  }
} 