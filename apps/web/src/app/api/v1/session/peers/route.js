import { NextResponse } from 'next/server';
import { activeSessions } from '@/lib/sessionStore';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');

  if (!roomId || !activeSessions.has(roomId)) {
    return NextResponse.json({ success: true, status: 'DISCONNECTED', peers: [] });
  }

  const session = activeSessions.get(roomId);
  if (session.status === 'DISCONNECTED' || !session.peers || session.peers.length === 0) {
    return NextResponse.json({ success: true, status: 'DISCONNECTED', peers: [] });
  }

  return NextResponse.json({
    success: true,
    roomId,
    status: session.status,
    peerCount: session.peers.length,
    peers: session.peers,
    networkVerified: true
  });
}
