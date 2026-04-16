import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLink, createAuthToken } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const playerId = await verifyMagicLink(token);

    if (!playerId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const authToken = await createAuthToken(playerId, player.email);

    const response = NextResponse.json({ success: true });
    response.cookies.set('auth-token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: parseInt(process.env.AUTH_TOKEN_EXPIRY || '604800000'),
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Verify magic link error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
