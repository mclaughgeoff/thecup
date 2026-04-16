import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const data = await request.json();

    // Note: name cannot be updated, only other profile fields
    const player = await prisma.player.update({
      where: { id: session.playerId },
      data: {
        nickname: data.nickname !== undefined ? data.nickname : undefined,
        handicap: data.handicap ? parseFloat(data.handicap) : undefined,
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
