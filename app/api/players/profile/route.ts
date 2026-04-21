import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';


export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const data = await request.json();

    // Note: name and handicap cannot be updated by players.
    // Handicap is admin-only — see /api/admin/players/[id]/handicap.
    const player = await prisma.player.update({
      where: { id: session.playerId },
      data: {
        nickname: data.nickname !== undefined ? data.nickname : undefined,
        arrivalDate: data.arrivalDate ? new Date(data.arrivalDate) : null,
        arrivalTime: data.arrivalTime || null,
        arrivalAirport: data.arrivalAirport || null,
        arrivalFlight: data.arrivalFlight || null,
        departureDate: data.departureDate ? new Date(data.departureDate) : null,
        departureTime: data.departureTime || null,
        departureAirport: data.departureAirport || null,
        departureFlight: data.departureFlight || null,
      },
    });

    return NextResponse.json(player);
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
