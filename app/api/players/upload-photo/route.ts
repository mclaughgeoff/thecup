import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';


const MAX_BYTES = 2 * 1024 * 1024; // 2 MB — stored inline as base64 in the DB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'File must be JPEG, PNG, or WebP' },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'File must be under 2 MB — please resize and try again' },
        { status: 400 }
      );
    }

    // Store the image inline as a base64 data URL. Works everywhere (local
    // dev + serverless) without object storage. Max 2 MB keeps per-row size
    // reasonable; for a 16-player trip this is fine.
    const bytes = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type};base64,${bytes.toString('base64')}`;

    const player = await prisma.player.update({
      where: { id: session.playerId },
      data: { photoUrl: dataUrl },
    });

    return NextResponse.json({ photoUrl: player.photoUrl });
  } catch (error) {
    console.error('Upload photo error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
