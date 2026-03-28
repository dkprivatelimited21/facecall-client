# 🎭 FaceCall

> Real-time 1-to-1 video calling with live AI face filters — privacy-first, no account required.

![FaceCall Banner](https://img.shields.io/badge/FaceCall-v1.0-6366f1?style=for-the-badge)
![WebRTC](https://img.shields.io/badge/WebRTC-P2P-22c55e?style=for-the-badge)
![MediaPipe](https://img.shields.io/badge/MediaPipe-FaceMesh-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-white?style=for-the-badge)

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 📹 Video Calling | WebRTC P2P, low latency, 1-to-1 |
| 🎭 Live Face Filter | MediaPipe FaceMesh 468-point tracking |
| 🖼️ Custom Overlay | Upload your own image (JPG/PNG/WEBP, max 10MB) |
| 🌀 Background Blur | Bokeh effect around face |
| 🔒 Privacy-first | No server-side storage, no accounts |
| 📱 Responsive | Works on mobile + desktop |
| ⚡ API Product | Monetizable face-swap REST API |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Browser (Client)                  │
│                                                       │
│  getUserMedia() ──► FaceSwapEngine ──► canvas        │
│  (webcam video)     (MediaPipe +        .captureStream│
│                      Canvas2D)          ()            │
│                          │                  │        │
│                          ▼                  ▼        │
│                    RTCPeerConnection ◄─────────      │
│                          │                           │
└──────────────────────────┼───────────────────────────┘
                           │ ICE / SDP (signaling only)
                           ▼
                  ┌─────────────────┐
                  │  Node.js Server  │
                  │  Express +       │
                  │  Socket.io       │
                  │  (no media relay)│
                  └─────────────────┘
```

### Face Filter Pipeline

```
Webcam Frame
     │
     ▼
MediaPipe FaceMesh  ──►  468 face landmarks
     │
     ▼
Extract key points (eyes, nose, chin, jaw oval)
     │
     ▼
Compute: center, rotation angle, scale from face bbox
     │
     ▼
Canvas2D: clip to face oval → rotate → draw overlay image
     │
     ▼
canvas.captureStream(30fps) ──► WebRTC video track
     │
     ▼
Remote peer sees swapped face in real time ✓
```

---

## 📦 Project Structure

```
facecall/
├── package.json              ← root scripts (concurrently)
├── render.yaml               ← Render deploy config
├── .gitignore
│
├── client/                   ← React + Vite frontend
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── vercel.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── styles/globals.css
│       ├── pages/
│       │   ├── HomePage.jsx    ← Join/Create room
│       │   ├── CallPage.jsx    ← Main video call UI
│       │   └── ApiDocsPage.jsx ← Face Swap API product page
│       ├── components/
│       │   ├── VideoTile.jsx   ← Video + canvas tile
│       │   ├── ControlBar.jsx  ← Mic/cam/filter/leave buttons
│       │   ├── FilterPanel.jsx ← Upload + filter settings
│       │   └── RoomInfo.jsx    ← Room code + status
│       └── utils/
│           ├── socket.js       ← Socket.io client singleton
│           ├── webrtc.js       ← RTCPeerConnection manager
│           ├── faceSwap.js     ← FaceSwapEngine (MediaPipe)
│           └── api.js          ← REST calls to server
│
└── server/                   ← Node.js + Express + Socket.io
    ├── server.js             ← Signaling server + room manager
    ├── package.json
    ├── nodemon.json
    └── .env.example
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### 1. Clone & Install

```bash
git clone https://github.com/yourname/facecall.git
cd facecall

# Install all dependencies in one command:
npm run install:all
```

### 2. Environment Variables

```bash
# Server
cp server/.env.example server/.env

# Client (optional for local dev — Vite proxy handles it)
cp client/.env.example client/.env
```

### 3. Run

```bash
npm run dev
```

This starts:
- **Backend** on `http://localhost:4000`
- **Frontend** on `http://localhost:5173`

### 4. Use

1. Open `http://localhost:5173`
2. Enter your name → click **New Room**
3. Copy the room code → share with someone (or open a second browser tab)
4. Join from the second window using the code
5. Click the 😊 button → upload a face image → toggle **Face Filter ON**
6. Watch your face transform in real time!

---

## 🎭 Face Filter — How It Works

The face swap runs entirely in the browser using:

| Component | Tech | Role |
|-----------|------|------|
| Face detection | MediaPipe FaceMesh (WASM) | 468-point landmark tracking at 30fps |
| Rendering | HTML Canvas 2D | Clip, rotate, composite the overlay |
| Streaming | `canvas.captureStream(30)` | Replace webcam track with canvas output |
| Peer delivery | WebRTC `RTCPeerConnection` | Send the processed video to remote peer |

### Key landmarks used:
- `#10` Forehead / `#152` Chin — vertical face extent
- `#33` / `#263` Left/right eye outer — rotation angle
- `#1` Nose tip — depth reference
- Face oval contour (37 points) — clip mask

### Performance tips:
- Uses `requestAnimationFrame` for smooth rendering
- Canvas clipping avoids overdraw outside face
- MediaPipe WASM runs in main thread (no worker needed for 1 face)
- Targets 30fps; degrades gracefully on weaker devices

---

## 🌐 Deployment

### Frontend → Vercel (free)

```bash
cd client

# Option A: Vercel CLI
npm i -g vercel
vercel

# Option B: Push to GitHub → Import on vercel.com
# Set env var: VITE_SERVER_URL = https://your-backend.onrender.com
```

### Backend → Render (free)

1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect repo → set root dir to `server`
4. Build: `npm install` | Start: `node server.js`
5. Add env var: `CLIENT_URL=https://your-app.vercel.app`

---

## 💰 Face Swap API (Monetize)

FaceCall ships with a built-in **API product page** at `/api-docs`.

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/detect` | Detect face & return 468 landmarks |
| `POST` | `/v1/swap` | Overlay face onto image |
| `POST` | `/v1/stream/token` | Get WebSocket token for real-time |

### Authentication

```
X-API-Key: fc_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

### Pricing Tiers (configured in ApiDocsPage.jsx)

| Plan | Price | Requests |
|------|-------|----------|
| Starter | $9/mo | 1,000/mo |
| Pro | $49/mo | 20,000/mo |
| Enterprise | $199/mo | Unlimited |

### To go live with the API:

1. Add real key validation middleware to `server.js`
2. Integrate [Stripe](https://stripe.com) for billing
3. Set up a Redis counter for rate limiting
4. Deploy the API on a separate route: `api.yourdomain.com`

---

## 🔒 Privacy & Security

- ❌ No video ever touches the server (WebRTC P2P)
- ❌ No images stored (browser memory only)
- ❌ No accounts or sessions persisted
- ❌ No database
- ✅ Socket.io used **only** for WebRTC signaling (SDP + ICE)
- ✅ All face processing happens in-browser (WASM + Canvas)

---

## 🛠️ Environment Variables

### Server (`server/.env`)

```env
PORT=4000
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)

```env
# Empty = use Vite proxy (local dev)
VITE_SERVER_URL=

# Production:
# VITE_SERVER_URL=https://facecall-server.onrender.com
```

---

## 🧩 WebRTC Signaling Flow

```
Alice                    Server (Socket.io)              Bob
  │                           │                           │
  │── join-room ─────────────►│                           │
  │◄─ room-joined (isInit) ───│                           │
  │                           │◄──────── join-room ───────│
  │◄─ user-joined ────────────│                           │
  │                           │──── room-joined ─────────►│
  │── [offer] ───────────────►│──── [offer] ─────────────►│
  │                           │◄─── [answer] ─────────────│
  │◄─ [answer] ───────────────│                           │
  │── [ice-candidate] ───────►│──── [ice-candidate] ─────►│
  │◄─ [ice-candidate] ────────│◄─── [ice-candidate] ───────│
  │                           │                           │
  │◄══════════════ P2P Video Stream ════════════════════►│
```

---

## 🤝 Contributing

PRs welcome! Ideas for next features:
- [ ] Group calls (up to 4 people)
- [ ] Text chat overlay
- [ ] Multiple filter presets (masks, hats, glasses)
- [ ] Screen share
- [ ] Recording (client-side MediaRecorder)

---

## 📄 License

MIT © 2024 FaceCall
