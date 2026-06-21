import { cookies } from 'next/headers';
import crypto from 'crypto';

/**
 * Verifies if the request contains a valid admin session cookie.
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('talesmiths_admin_session')?.value;
    if (!sessionToken) return false;

    const adminPassword = process.env.ADMIN_PASSWORD || 'series07';
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret';
    
    const expectedToken = crypto
      .createHmac('sha256', secret)
      .update(adminPassword)
      .digest('hex');

    return sessionToken === expectedToken;
  } catch (error) {
    console.error('checkIsAdmin error:', error);
    return false;
  }
}
