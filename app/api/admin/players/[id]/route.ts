import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function authErrStatus(message: string): number {
  if (message === 'Unauthorized') return 401;
  if (message === 'Admin access required') return 403;
  return 500;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await request.json();

    const data: Record<string, unknown> = {};

    if (body.name !== undefined)             data.name = body.name;
    if (body.nickname !== undefined)         data.nickname = body.nickname || null;
    if (body.handicap !== undefined)         data.handicap = parseFloat(body.handicap);
    if (body.isAdmin !== undefined)          data.isAdmin = Boolean(body.isAdmin);
    if (body.villaId !== undefined)          data.villaId = body.villaId || null;
    if (body.arrivalDate !== undefined)      data.arrivalDate = body.arrivalDate ? new Date(body.arrivalDate) : null;
    if (body.arrivalTime !== undefined)      data.arrivalTime = body.arrivalTime || null;
    if (body.arrivalAirport !== undefined)   data.arrivalAirport = body.arrivalAirport || null;
    if (body.arrivalFlight !== undefined)    data.arrivalFlight = body.arrivalFlight || null;
    if (body.departureDate !== undefined)    data.departureDate = body.departureDate ? new Date(body.departureDate) : null;
    if (body.departureTime !== undefined)    data.departureTime = body.departureTime || null;
    if (body.departureAirport !== undefined) data.departureAirport = body.departureAirport || null;
    if (body.departureFlight !== undefined)  data.departureFlight = body.departureFlight || null;

    if (data.handicap !== undefined && Number.isNaN(data.handicap as number)) {
      return NextResponse.json({ error: 'Invalid handicap' }, { status: 400 });
    }

    const player = await prisma.player.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(player);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: authErrStatus(message) });
  }
}
