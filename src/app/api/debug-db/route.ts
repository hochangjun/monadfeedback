import { NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';

export async function GET() {
  try {
    if (!sql) {
      return NextResponse.json({ 
        error: 'No DATABASE_URL configured',
        hasDatabase: false 
      });
    }

    // Test basic connection
    const result = await sql`SELECT NOW() as current_time`;
    console.log('Database connection test:', result);

    // Try to initialize database
    await initDatabase();

    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('feedback', 'user_history')
    `;

    // Count records in tables
    let feedbackCount = 0;
    let historyCount = 0;
    
    try {
      const feedbackResult = await sql`SELECT COUNT(*) as count FROM feedback`;
      feedbackCount = feedbackResult[0].count;
    } catch (e) {
      console.log('Error counting feedback:', e);
    }

    try {
      const historyResult = await sql`SELECT COUNT(*) as count FROM user_history`;
      historyCount = historyResult[0].count;
    } catch (e) {
      console.log('Error counting history:', e);
    }

    return NextResponse.json({
      hasDatabase: true,
      connection: 'working',
      currentTime: result[0].current_time,
      tables: tables.map(t => t.table_name),
      counts: {
        feedback: feedbackCount,
        userHistory: historyCount
      }
    });

  } catch (error) {
    console.error('Database debug error:', error);
    return NextResponse.json({
      hasDatabase: !!sql,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 