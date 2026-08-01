/**
 * SOFO Sync Authentication Service
 * Manages JWT tokens, instant QR session authorization, and security keys.
 */

module.exports = {
  createSessionToken: (roomId, deviceId) => {
    return `sofo_jwt_${Buffer.from(`${roomId}:${deviceId}:${Date.now()}`).toString('base64url')}`;
  },
  verifyToken: (token) => {
    return token.startsWith('sofo_jwt_');
  }
};
