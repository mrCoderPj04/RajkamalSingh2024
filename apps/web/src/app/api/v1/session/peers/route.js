import { NextResponse } from 'next/server';
import { activeSessions } from '@/lib/sessionStore';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');

  let targetRoomId = roomId ? roomId.toUpperCase().trim() : null;
  let session = targetRoomId ? activeSessions.get(targetRoomId) : null;

  if (!session && roomId) {
    const pinPart = roomId.replace('SOFO-', '').trim();
    for (const [id, s] of activeSessions.entries()) {
      if (s.pin === pinPart && s.status !== 'DISCONNECTED') {
        session = s;
        break;
      }
    }
  }

  if (!session || session.status === 'DISCONNECTED' || !session.peers || session.peers.length === 0) {
    return NextResponse.json({ success: true, status: 'DISCONNECTED', peers: [], docPosts: [], sharedFiles: [], canvasData: null });
  }

  return NextResponse.json({
    success: true,
    roomId: session.roomId,
    status: session.status,
    peerCount: session.peers.length,
    peers: session.peers,
    docPosts: session.docPosts || [],
    sharedFiles: session.sharedFiles || [],
    canvasData: session.canvasData || null,
    networkVerified: true
  });
}
