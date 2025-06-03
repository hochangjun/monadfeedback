import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST() {
  try {
    if (!sql) {
      return NextResponse.json({ error: 'No database connection' }, { status: 500 });
    }

    // Add x_handle column if it doesn't exist
    await sql`
      ALTER TABLE feedback 
      ADD COLUMN IF NOT EXISTS x_handle VARCHAR(15)
    `;

    console.log('Schema migration completed: x_handle column added');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Schema migration completed successfully' 
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 