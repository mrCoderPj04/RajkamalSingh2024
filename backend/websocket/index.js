/**
 * SOFO Sync Real-Time WebSocket & Peer Signaling Dispatcher
 */

class WebSocketSyncServer {
  constructor() {
    this.rooms = new Map();
  }

  handlePairRequest(client, roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(client);
    return { event: 'PAIRED', roomId, status: 'CONNECTED' };
  }

  broadcast(roomId, event, payload) {
    const clients = this.rooms.get(roomId);
    if (!clients) return;
    for (const client of clients) {
      // Dispatch real-time state sync payload
      client.send?.(JSON.stringify({ event, payload }));
    }
  }
}

module.exports = WebSocketSyncServer;
