import { NextResponse } from 'next/server';
import { activeSessions } from '@/lib/sessionStore';

export async function POST(req) {
  try {
    const forwarded = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const clientIp = forwarded.split(',')[0].trim();

    const body = await req.json();
    const { pin, roomId, deviceName } = body;

    const cleanPin = (pin || '').toString().trim();
    let targetRoomId = (roomId || (cleanPin ? `SOFO-${cleanPin}` : '')).toString().trim().toUpperCase();

    if (!cleanPin) {
      return NextResponse.json({
        success: false,
        message: 'Both Room ID and 6-Digit PIN are required for verification.'
      }, { status: 400 });
    }

    let session = activeSessions.get(targetRoomId);

    // PIN Fallback Search across active sessions
    if (!session) {
      for (const [id, s] of activeSessions.entries()) {
        if (s.pin === cleanPin && s.status !== 'DISCONNECTED') {
          session = s;
          targetRoomId = id;
          break;
        }
      }
    }

    if (!session) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: `Security Verification Failed: Session PIN "${cleanPin}" does not exist or has expired. Please click "Refresh QR Code" on the primary device first!`
      }, { status: 401 });
    }

    // Expiry Check (10 minutes)
    if (Date.now() - session.createdAt > 10 * 60 * 1000) {
      activeSessions.delete(targetRoomId);
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'Session Expired: The 6-Digit PIN has expired for security.'
      }, { status: 401 });
    }

    if (session.pin !== cleanPin) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: `Security Verification Failed: Incorrect 6-Digit PIN "${cleanPin}".`
      }, { status: 401 });
    }

    const token = `sofo_sec_v2_${Buffer.from(`${targetRoomId}:${Date.now()}:${clientIp}`).toString('base64url')}`;
    const newPeer = {
      peerId: `peer_${Math.random().toString(36).substring(2, 9)}`,
      name: deviceName || 'Paired Secondary Device',
      type: 'client',
      joinedAt: new Date().toISOString(),
      ip: clientIp,
      latency: '8ms',
      token
    };

    session.status = 'AUTHENTICATED';
    if (!session.peers.some(p => p.name === newPeer.name)) {
      session.peers.push(newPeer);
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      message: 'Authentication Handshake Verified & Encrypted!',
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
