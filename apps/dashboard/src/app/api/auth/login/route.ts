import { NextResponse } from 'next/server';
import { getAuthUsername, getAuthPassword, createSessionToken, COOKIE_NAME } from '@/lib/auth';
import {
  checkBruteForce,
  recordFailedAttempt,
  resetAttempts,
  timingSafeCompare,
  getClientIp,
} from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const body = await request.json().catch(() => ({}));
    const { username = '', password = '', rememberMe = true } = body;

    const trimmedUsername = String(username).trim();
    const trimmedPassword = String(password).trim();

    const rateLimitKey = `${clientIp}:${trimmedUsername.toLowerCase() || 'unknown'}`;

    const status = checkBruteForce(rateLimitKey);
    if (!status.allowed) {
      const minutes = Math.ceil(status.retryAfterSeconds / 60);
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan login gagal. Akses dikunci sementara selama ${minutes} menit.`,
          locked: true,
          retryAfterSeconds: status.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    if (!trimmedUsername || !trimmedPassword) {
      return NextResponse.json(
        { error: 'Username dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const expectedUsername = getAuthUsername();
    const expectedPassword = getAuthPassword();

    const isUserMatch = timingSafeCompare(trimmedUsername, expectedUsername);
    const isPassMatch = timingSafeCompare(trimmedPassword, expectedPassword);

    if (!isUserMatch || !isPassMatch) {
      const attemptInfo = recordFailedAttempt(rateLimitKey);

      if (attemptInfo.locked) {
        const minutes = Math.ceil(attemptInfo.retryAfterSeconds / 60);
        return NextResponse.json(
          {
            error: `Batas percobaan login terlampaui. Akun dikunci sementara selama ${minutes} menit.`,
            locked: true,
            retryAfterSeconds: attemptInfo.retryAfterSeconds,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: `Username atau password salah. Sisa percobaan: ${attemptInfo.remaining} kali.`,
          remaining: attemptInfo.remaining,
        },
        { status: 401 }
      );
    }

    resetAttempts(rateLimitKey);

    const { token, maxAge } = await createSessionToken(Boolean(rememberMe));

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      user: { username: expectedUsername },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Terjadi kesalahan sistem saat memproses login.' },
      { status: 500 }
    );
  }
}
