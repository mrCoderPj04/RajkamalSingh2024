import { NextResponse } from 'next/server';
import { activeSessions } from '@/lib/sessionStore';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');

  if (!roomId || !activeSessions.has(roomId)) {
    return NextResponse.json({ success: true, peers: [] });
  }

  const session = activeSessions.get(roomId);
  return NextResponse.json({
    success: true,
    roomId,
    status: session.status,
    peerCount: session.peers.length,
    peers: session.peers
  });
}
