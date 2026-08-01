/**
 * SOFO Sync Active Session Manager
 * Tracks connected peers, latency stats, and room heartbeats.
 */

class SessionManager {
  constructor() {
    this.activeSessions = new Map();
  }

  registerPeer(roomId, peerInfo) {
    if (!this.activeSessions.has(roomId)) {
      this.activeSessions.set(roomId, []);
    }
    const list = this.activeSessions.get(roomId);
    list.push({ ...peerInfo, connectedAt: new Date().toISOString() });
    return list;
  }

  getActivePeers(roomId) {
    return this.activeSessions.get(roomId) || [];
  }
}

module.exports = new SessionManager();
