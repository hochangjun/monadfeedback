import { neon } from '@neondatabase/serverless';

// Initialize database connection
const sql = neon(process.env.DATABASE_URL!);

// Database schema
export const initDatabase = async () => {
  try {
    // Create feedback table
    await sql`
      CREATE TABLE IF NOT EXISTS feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        feedback_text TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        payment_amount VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        anonymous_timestamp TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `;

    // Create user_history table for tracking submissions
    await sql`
      CREATE TABLE IF NOT EXISTS user_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        feedback_id UUID REFERENCES feedback(id),
        wallet_address VARCHAR(42) NOT NULL,
        category VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        anonymous_timestamp TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `;

    // Create index for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_history_wallet 
      ON user_history(wallet_address)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_feedback_category 
      ON feedback(category)
    `;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export { sql }; 