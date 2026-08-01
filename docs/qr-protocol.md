# SOFO Sync - Instant QR Handshake Protocol

## Protocol Specification

The SOFO QR Handshake uses a custom URI scheme `sofo://` containing base64-encoded JSON metadata.

```json
{
  "protocol": "SOFO-SYNC/1.0",
  "roomId": "sofo-room-98231",
  "peerId": "peer-mobile-77",
  "timestamp": 1754041200000
}
```

## Lifecycle Steps
1. **Generation**: Web/Desktop client creates a session room ID and renders a dynamic QR code.
2. **Scan**: Mobile client scans QR code via camera or URL deep-link.
3. **P2P Signal**: Both clients send WebRTC SDP offers/answers over WebSocket signaling channel (`backend/websocket`).
4. **Active Sync**: Session is established in under 300ms without manual sign-in required.
