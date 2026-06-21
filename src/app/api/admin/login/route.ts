import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD || 'series07';

    if (password === adminPassword) {
      const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret';
      const token = crypto
        .createHmac('sha256', secret)
        .update(adminPassword)
        .digest('hex');

      const cookieStore = await cookies();
      cookieStore.set('talesmiths_admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days session
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
