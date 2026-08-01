/**
 * SOFO Sync API Gateway Service (Production - Port 5000)
 * Integrated with Real Google Gemini AI API
 */

const http = require('http');
const aiEngine = require('../ai/index.js');

const PORT = process.env.PORT || 5000;

// Active paired sessions store: Map<RoomID, SessionObject>
const activeSessions = new Map();

const parseJsonBody = (req) => {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
};

const server = http.createServer(async (req, res) => {
  // CORS & Content-Type Headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Health Check
  if (url.pathname === '/health' || url.pathname === '/api/v1/health') {
    return res.end(JSON.stringify({
      status: 'OK',
      service: 'SOFO Sync API Gateway',
      port: PORT,
      aiEngine: 'Google Gemini AI Enabled',
      activeRooms: activeSessions.size,
      timestamp: new Date().toISOString()
    }));
  }

  // Generate QR Code & Register Session Room
  if (url.pathname === '/api/v1/auth/qr/generate' && req.method === 'POST') {
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

    return res.end(JSON.stringify({
      success: true,
      roomId,
      pin,
      qrPayload,
      expiresInSeconds: 600,
      timestamp: new Date().toISOString()
    }));
  }

  // Authentication Handshake Pair Request
  if (url.pathname === '/api/v1/auth/pair' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const { pin, roomId, deviceName } = body;

    const targetRoomId = roomId || (pin ? `SOFO-${pin}` : null);
    if (!targetRoomId || !pin) {
      res.statusCode = 400;
      return res.end(JSON.stringify({
        success: false,
        message: 'Both Room ID and 6-Digit PIN are required for verification.'
      }));
    }

    const session = activeSessions.get(targetRoomId);

    if (!session) {
      res.statusCode = 401;
      return res.end(JSON.stringify({
        success: false,
        authenticated: false,
        message: `Authentication Failed: Room ${targetRoomId} does not exist. Please click "Generate QR Code" on the primary device first!`
      }));
    }

    if (session.pin !== pin) {
      res.statusCode = 401;
      return res.end(JSON.stringify({
        success: false,
        authenticated: false,
        message: `Authentication Failed: Incorrect 6-Digit PIN "${pin}". Verification denied.`
      }));
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

    return res.end(JSON.stringify({
      success: true,
      authenticated: true,
      message: 'Authentication Handshake Verified! Devices Linked.',
      sessionToken: token,
      roomId: targetRoomId,
      peer: newPeer,
      allPeers: session.peers,
      connectedAt: new Date().toISOString()
    }));
  }

  // Get Live Connected Peers for a Room
  if (url.pathname === '/api/v1/session/peers' && req.method === 'GET') {
    const roomId = url.searchParams.get('roomId');
    if (!roomId || !activeSessions.has(roomId)) {
      return res.end(JSON.stringify({ success: true, peers: [] }));
    }
    const session = activeSessions.get(roomId);
    return res.end(JSON.stringify({
      success: true,
      roomId,
      status: session.status,
      peerCount: session.peers.length,
      peers: session.peers
    }));
  }

  // REAL GOOGLE GEMINI AI COPILOT CHAT ENDPOINT
  if (url.pathname === '/api/v1/ai/chat' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const { prompt, docContext, roomId } = body;

    if (!prompt || !prompt.trim()) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false, error: 'Prompt is required.' }));
    }

    const systemContext = `Active Room: ${roomId || 'Authenticated'}. ${docContext ? `Collaborative Doc Text: "${docContext.slice(0, 500)}"` : ''}`;
    const aiReply = await aiEngine.generateGeminiResponse(prompt, systemContext);

    return res.end(JSON.stringify({
      success: true,
      reply: aiReply,
      model: 'Google Gemini 1.5 Flash',
      timestamp: new Date().toISOString()
    }));
  }

  // Session Disconnect Endpoint
  if (url.pathname === '/api/v1/session/disconnect' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const { roomId, peerId } = body;
    if (roomId && activeSessions.has(roomId)) {
      const session = activeSessions.get(roomId);
      session.peers = session.peers.filter(p => p.peerId !== peerId);
    }
    return res.end(JSON.stringify({ success: true, message: 'Device disconnected.' }));
  }

  // Default 404
  res.statusCode = 404;
  return res.end(JSON.stringify({ error: 'Endpoint not found', service: 'SOFO Sync API v1.0' }));
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[SOFO Sync API] Production Gateway with Google Gemini AI active on http://localhost:${PORT}`);
  });
}

module.exports = server;
