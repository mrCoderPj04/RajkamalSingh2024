# SOFO Sync ⚡
> **One QR. Instant Connection. Real-Time Collaboration.**

![SOFO Sync Monorepo Architecture](https://img.shields.io/badge/Architecture-Monorepo-blueviolet?style=for-the-badge)
![Next.js 15](https://img.shields.io/badge/Next.js-15.0.4-black?style=for-the-badge&logo=next.js)
![React 19](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## 🌟 Overview

**SOFO Sync** empowers cross-device collaboration in seconds. Scan **One QR Code** to instantly pair your mobile, web, and desktop devices into a high-speed real-time workspace featuring interactive whiteboards, collaborative documents, media streaming, and AI assistance.

---

## 📂 Repository Structure

```
SOFO-Sync/
│
├── apps/
│   ├── web/           # Next.js 15 Web Workspace & Collaboration Dashboard
│   ├── mobile/        # React Native / PWA Mobile Companion
│   └── desktop/       # Electron / Tauri Native Desktop App
│
├── backend/
│   ├── api/           # REST API Gateway Service
│   ├── websocket/     # Real-time WebSocket & Peer Signaling Relay
│   ├── auth/          # Authentication & QR Security Tokens
│   ├── session/       # Active Session & Peer State Tracker
│   ├── upload/        # High-speed File Upload Engine
│   ├── media/         # WebRTC Video/Audio Streaming Service
│   ├── documents/     # Collaborative Document Sync Engine
│   ├── whiteboard/    # Dynamic Canvas Whiteboard State Synchronizer
│   ├── storage/       # Multi-target Storage Abstraction Adapter
│   ├── database/      # Database Schemas & Persistence Client
│   └── ai/            # SOFO AI Assistant & Summarization Engine
│
├── shared/            # Shared Types, Constants & QR Handshake Helpers
├── docker/            # Container Deployment & Compose Setup
├── docs/              # Specifications, API & Protocol Documentation
└── README.md          # Project Overview
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: `v18.x` or `v20.x`
- **npm**: `v9.x` or later

### Installation & Execution

```bash
# Clone the repository
git clone https://github.com/mrCoderPj04/RajkamalSingh2024.git SOFO-Sync
cd SOFO-Sync

# Install workspace dependencies
npm install

# Launch web application
npm run dev
```

Visit **http://localhost:3000** to launch **SOFO Sync**.

---

## ✨ Features

- 📱 **One QR Instant Pairing**: Scan to connect devices in <300ms without account friction.
- 🎨 **Dynamic Whiteboard**: Draw, erase, place vector shapes, and broadcast real-time canvas strokes.
- 📝 **Live Collaborative Documents**: Edit text simultaneously with peer presence indicators.
- 📁 **Instant File Transfer Vault**: Fast local drop-and-share for files and images.
- 🤖 **SOFO AI Copilot**: Generate summaries, outline ideas, and answer session queries on the fly.
- 🐳 **Docker Ready**: One-command deployment with `docker-compose up`.

---

## 📚 Documentation
- [System Architecture](file:///home/mr_coder_04/Documents/PROJECT/docs/architecture.md)
- [QR Handshake Protocol](file:///home/mr_coder_04/Documents/PROJECT/docs/qr-protocol.md)
- [Real-Time Collaboration Specs](file:///home/mr_coder_04/Documents/PROJECT/docs/realtime-collaboration.md)

---

Developed with ❤️ by the **MrCoder**.
