/**
 * SOFO Sync QR Protocol Helpers & Payload Utilities
 */

function generateQRPayload(roomId, peerId) {
  const timestamp = Date.now();
  const raw = JSON.stringify({
    protocol: 'SOFO-SYNC/1.0',
    roomId,
    peerId,
    timestamp
  });
  const encoded = Buffer.from(raw).toString('base64');
  return `sofo://${encoded}`;
}

function parseQRPayload(qrString) {
  try {
    if (!qrString.startsWith('sofo://')) return null;
    const base64 = qrString.replace('sofo://', '');
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (err) {
    return null;
  }
}

module.exports = {
  generateQRPayload,
  parseQRPayload
};
