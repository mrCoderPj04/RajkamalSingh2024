/**
 * SOFO Sync Real-Time Canvas Whiteboard State Synchronizer
 */

class WhiteboardSync {
  constructor() {
    this.canvasStrokes = new Map();
  }

  addStroke(roomId, strokeData) {
    if (!this.canvasStrokes.has(roomId)) {
      this.canvasStrokes.set(roomId, []);
    }
    this.canvasStrokes.get(roomId).push(strokeData);
    return this.canvasStrokes.get(roomId);
  }

  clearCanvas(roomId) {
    this.canvasStrokes.set(roomId, []);
    return [];
  }
}

module.exports = new WhiteboardSync();
