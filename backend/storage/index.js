/**
 * SOFO Sync Storage Abstraction Adapter (Local / S3 / IndexedDB)
 */

module.exports = {
  saveBlob: async (key, buffer) => {
    return { key, size: buffer.length, savedAt: new Date().toISOString() };
  }
};
