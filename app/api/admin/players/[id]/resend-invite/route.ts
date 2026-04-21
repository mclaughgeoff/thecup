import { NextResponse } from 'next/server';
import { requireAdmin, createMagicLink } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const player = await prisma.player.findUnique({ where: { id: params.id } });
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const magicLink = await createMagicLink(player.id);

    try {
      await sendMagicLinkEmail(player.email, player.name, magicLink);
    } catch (emailError) {
      console.error('Email send error:', emailError);
    }

    await prisma.player.update({
      where: { id: player.id },
      data: { inviteSent: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' ? 401 : message === 'Admin access required' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
