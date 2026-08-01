# SOFO Sync - Monorepo System Architecture

SOFO Sync is built around three core pillars: **One QR Pairing**, **Instant Peer Connection**, and **Real-Time Multi-Surface Collaboration**.

```
                         ┌─────────────────────────────┐
                         │   SOFO Sync Web Application │
                         │        (apps/web)           │
                         └──────────────┬──────────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         │   SOFO QR Handshake Layer   │
                         │    (sofo://sync?room=XYZ)   │
                         └──────────────┬──────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           │                            │                            │
 ┌─────────┴─────────┐        ┌─────────┴─────────┐        ┌─────────┴─────────┐
 │   WebSocket Sync  │        │   Media / WebRTC  │        │   SOFO AI Engine  │
 │(backend/websocket)│        │  (backend/media)  │        │   (backend/ai)    │
 └───────────────────┘        └───────────────────┘        └───────────────────┘
```

## Microservices Breakdown

1. **`apps/web`**: Next.js 15 app providing the main UI dashboard, whiteboard canvas, collaborative doc editor, and QR manager.
2. **`apps/mobile`**: React Native / Expo application for camera QR scanning and mobile-friendly canvas drawing.
3. **`apps/desktop`**: Electron / Tauri container for system tray integration and hardware display sharing.
4. **`backend/websocket`**: Real-time room relay server for canvas stroke synchronization and doc deltas.
5. **`backend/ai`**: AI context processor for document summaries and smart assistance.
6. **`backend/auth` & `backend/session`**: Security token issuance and connected peer state management.
