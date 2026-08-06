import { NextResponse } from 'next/server';
import { activeSessions } from '@/lib/sessionStore';

export async function POST(req) {
  try {
    const body = await req.json();
    const { pin, roomId, deviceName } = body;

    const targetRoomId = roomId || (pin ? `SOFO-${pin}` : null);
    if (!targetRoomId || !pin) {
      return NextResponse.json({
        success: false,
        message: 'Both Room ID and 6-Digit PIN are required for verification.'
      }, { status: 400 });
    }

    const session = activeSessions.get(targetRoomId);

    if (!session) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: `Authentication Failed: Room ${targetRoomId} does not exist. Please click "Generate QR Code" on the primary device first!`
      }, { status: 401 });
    }

    if (session.pin !== pin) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: `Authentication Failed: Incorrect 6-Digit PIN "${pin}". Verification denied.`
      }, { status: 401 });
    }

    const token = `sofo_jwt_${Buffer.from(`${targetRoomId}:${Date.now()}:${Math.random()}`).toString('base64url')}`;
    const newPeer = {
      peerId: `peer_${Math.random().toString(36).substring(2, 9)}`,
      name: deviceName || 'Paired Secondary Device',
      type: 'client',
      joinedAt: new Date().toISOString(),
      latency: `${Math.floor(8 + Math.random() * 12)}ms`,
      token
    };

    session.status = 'AUTHENTICATED';
    if (!session.peers.some(p => p.name === newPeer.name)) {
      session.peers.push(newPeer);
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      message: 'Authentication Handshake Verified! Devices Linked.',
      sessionToken: token,
      roomId: targetRoomId,
      peer: newPeer,
      allPeers: session.peers,
      connectedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Invalid payload.' }, { status: 400 });
  }
}
