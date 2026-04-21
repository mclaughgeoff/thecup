import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createMagicLink } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';


export async function POST(request: NextRequest) {
  try {
    const { email: raw } = await request.json();

    if (!raw || typeof raw !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Normalize: trim + lowercase. Emails are case-insensitive per RFC 5321
    // (local-part technically isn't, but every major provider treats it as such).
    // Our @unique column is case-sensitive, so we fall back to a case-insensitive
    // findFirst to tolerate any legacy mixed-case rows.
    const email = raw.trim().toLowerCase();

    const player =
      (await prisma.player.findUnique({ where: { email } })) ??
      (await prisma.player.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      }));

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
