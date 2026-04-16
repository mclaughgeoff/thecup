import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createMagicLink } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { playerIds } = await request.json();

    if (!playerIds || !Array.isArray(playerIds)) {
      return NextResponse.json(
        { error: 'playerIds array is required' },
        { status: 400 }
      );
    }

    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } },
    });

    const sentCount = await Promise.all(
      players.map(async (player) => {
        try {
          const magicLink = await createMagicLink(player.id);
          await sendMagicLinkEmail(player.email, player.name, magicLink);
          await prisma.player.update({
            where: { id: player.id },
            data: { inviteSent: true },
          });
          return true;
        } catch (error) {
          console.error(`Error sending invite to ${player.email}:`, error);
          return false;
        }
      })
    );

    const successCount = sentCount.filter(Boolean).length;

    return NextResponse.json({
      success: true,
      sent: successCount,
      total: playerIds.length,
    });
  } catch (error) {
    console.error('Send invites bulk error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
