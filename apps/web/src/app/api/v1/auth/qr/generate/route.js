import { NextResponse } from 'next/server';
import { activeSessions } from '@/lib/sessionStore';

export async function POST() {
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  const roomId = `SOFO-${pin}`;
  const qrPayload = `sofo://sync?room=${roomId}&pin=${pin}&t=${Date.now()}`;

  const hostPeer = {
    peerId: `host_${Math.random().toString(36).substring(2, 9)}`,
    name: 'Host Device (Primary)',
    type: 'host',
    joinedAt: new Date().toISOString(),
    latency: '4ms'
  };

  activeSessions.set(roomId, {
    roomId,
    pin,
    status: 'WAITING_FOR_PEER',
    createdAt: new Date().toISOString(),
    peers: [hostPeer]
  });

  return NextResponse.json({
    success: true,
    roomId,
    pin,
    qrPayload,
    expiresInSeconds: 600,
    timestamp: new Date().toISOString()
  });
}
