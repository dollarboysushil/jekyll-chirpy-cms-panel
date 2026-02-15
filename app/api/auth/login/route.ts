import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createToken, setAuthCookie } from '@/lib/auth';
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { sanitizeString } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 attempts per 15 minutes per IP
    const rateLimit = rateLimitMiddleware(request, {
      maxRequests: 5,
      windowSeconds: 900, // 15 minutes
    });
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Too many login attempts. Please try again in ${rateLimit.retryAfter} seconds.` 
        },
        { 
          status: 429,
          headers: rateLimit.headers,
        }
      );
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedPassword = sanitizeString(password, 100);

    if (!verifyPassword(sanitizedPassword)) {
      // Add small delay to slow down brute force attempts
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401, headers: rateLimit.headers }
      );
    }

    const token = await createToken();
    await setAuthCookie(token);

    return NextResponse.json(
      { success: true },
      { headers: rateLimit.headers }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
