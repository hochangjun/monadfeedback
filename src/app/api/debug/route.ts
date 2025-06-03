import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasPrivyAppId: !!process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    privyAppIdLength: process.env.NEXT_PUBLIC_PRIVY_APP_ID?.length || 0,
    hasPrivySecret: !!process.env.PRIVY_APP_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
  });
} 