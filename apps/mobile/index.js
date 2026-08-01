/**
 * SOFO Sync Mobile Entrypoint
 * Module for mobile camera QR scanning, PWA pairing, and mobile collaboration view.
 */

console.log('[SOFO Sync Mobile] Initializing Mobile Connection Client...');

module.exports = {
  appName: 'SOFO Sync Mobile',
  version: '1.0.0',
  features: ['Camera QR Scanner', 'Peer Pairing', 'Whiteboard Mobile Touch Controls', 'Media Stream']
};
