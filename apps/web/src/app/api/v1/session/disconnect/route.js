import { NextResponse } from 'next/server';
import { activeSessions } from '@/lib/sessionStore';

export async function POST(req) {
  try {
    const body = await req.json();
    const { roomId } = body;

    if (roomId && activeSessions.has(roomId)) {
      const session = activeSessions.get(roomId);
      session.status = 'DISCONNECTED';
      session.peers = [];
      setTimeout(() => {
        activeSessions.delete(roomId);
      }, 5000);
    }

    return NextResponse.json({
      success: true,
      status: 'DISCONNECTED',
      message: 'Session terminated. Devices returning home.'
    });
  } catch (error) {
    return NextResponse.json({ success: true, status: 'DISCONNECTED' });
  }
}
