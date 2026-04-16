import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createMagicLink } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const player = await prisma.player.findUnique({
      where: { email },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const magicLink = await createMagicLink(player.id);

    // Send email
    try {
      await sendMagicLinkEmail(email, player.name, magicLink);
    } catch (emailError) {
      console.error('Email send error:', emailError);
      // Still return success so user knows email was processed
    }

    return NextResponse.json({ success: true, message: 'Magic link sent' });
  } catch (error) {
    console.error('Request link error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
