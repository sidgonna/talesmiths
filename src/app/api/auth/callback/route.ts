import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/profile';

  if (code) {
    const supabase = await createClient();
    
    // Exchange the temporary OAuth code for an active Supabase user session
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data?.user) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalHost = origin.startsWith('http://localhost');
      
      const redirectUrl = isLocalHost 
        ? `${origin}${next}`
        : forwardedHost 
          ? `https://${forwardedHost}${next}`
          : `${origin}${next}`;
          
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Redirect to basic login error route in case of failure
  return NextResponse.redirect(`${origin}/login?error=OAuth exchange failed`);
}
