import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createMagicLink } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { playerId } = await request.json();

    if (!playerId) {
      return NextResponse.json({ error: 'playerId is required' }, { status: 400 });
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const magicLink = await createMagicLink(playerId);

    // Send email
    try {
      await sendMagicLinkEmail(player.email, player.name, magicLink);
    } catch (emailError) {
      console.error('Email send error:', emailError);
    }

    // Mark as invited
    await prisma.player.update({
      where: { id: playerId },
      data: { inviteSent: true },
    });

    return NextResponse.json({ success: true, message: 'Invite sent' });
  } catch (error) {
    console.error('Send invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
