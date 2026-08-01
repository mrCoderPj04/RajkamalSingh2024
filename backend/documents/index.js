/**
 * SOFO Sync Collaborative Document Operational Transform (OT) Engine
 */

class DocumentEngine {
  constructor() {
    this.documents = new Map();
  }

  applyDelta(docId, delta) {
    const current = this.documents.get(docId) || '';
    const updated = current + (delta.text || '');
    this.documents.set(docId, updated);
    return { docId, content: updated, version: (delta.version || 0) + 1 };
  }
}

module.exports = new DocumentEngine();
