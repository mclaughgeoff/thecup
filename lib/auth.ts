import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const MAGIC_LINK_SECRET = process.env.MAGIC_LINK_SECRET || 'dev-magic-secret';
const AUTH_TOKEN_EXPIRY = parseInt(process.env.AUTH_TOKEN_EXPIRY || '604800000'); // 7 days

export interface AuthSession {
  playerId: string;
  email: string;
}

export async function createAuthToken(playerId: string, email: string): Promise<string> {
  const token = jwt.sign({ playerId, email }, JWT_SECRET, {
    expiresIn: Math.floor(AUTH_TOKEN_EXPIRY / 1000), // Convert ms to seconds
  });
  return token;
}

export async function verifyAuthToken(token: string): Promise<AuthSession | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthSession;
    return decoded;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return null;
    return verifyAuthToken(token);
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: AUTH_TOKEN_EXPIRY,
    path: '/',
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}

export async function createMagicLink(playerId: string): Promise<string> {
  const token = jwt.sign({ playerId }, MAGIC_LINK_SECRET, {
    expiresIn: '24h',
  });

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.magicLink.create({
    data: {
      token,
      playerId,
      expiresAt,
    },
  });

  return token;
}

export async function verifyMagicLink(token: string): Promise<string | null> {
  try {
    const decoded = jwt.verify(token, MAGIC_LINK_SECRET) as { playerId: string };

    const magicLink = await prisma.magicLink.findUnique({
      where: { token },
    });

    if (!magicLink || magicLink.usedAt || magicLink.expiresAt < new Date()) {
      return null;
    }

    // Mark as used
    await prisma.magicLink.update({
      where: { token },
      data: { usedAt: new Date() },
    });

    return decoded.playerId;
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireAdmin(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const player = await prisma.player.findUnique({
    where: { id: session.playerId },
  });

  if (!player?.isAdmin) {
    throw new Error('Admin access required');
  }

  return session;
}
