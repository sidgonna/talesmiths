import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const supabase = createAdminClient();

    // Upsert subscription (if they are already subscribed, keep confirmed: true)
    const { error } = await supabase
      .from('email_subscribers')
      .upsert(
        { 
          email: cleanEmail, 
          confirmed: true, // Direct confirmation as per open questions proposal
        },
        { onConflict: 'email' }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: 'Failed to record subscription' }, { status: 500 });
  }
}
