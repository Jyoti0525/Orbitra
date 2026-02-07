# 🌌 Orbitra - Cosmic Watch Platform

**Near-Earth Object Monitoring & Risk Analysis System**

Built for IITB Hackathon | Real-time asteroid tracking with NASA NeoWs API

---

## 🚀 Tech Stack

- **Frontend:** React (Vite) + Firebase SDK + Tailwind CSS + React Three Fiber
- **Backend:** Node.js + Express + Firebase Admin SDK
- **Database:** Firestore (NoSQL)
- **Auth:** Google Sign-In (Firebase Auth)
- **Deployment:** Docker

---

## 📋 Prerequisites

- Node.js 18+ or 20+
- Docker & Docker Compose
- Firebase Project (free tier)
- NASA API Key (already included)

---

## ⚡ Quick Start

### 1. Firebase Setup

1. Create Firebase project at https://console.firebase.google.com/
2. Enable Google Sign-In in Authentication
3. Create Firestore database (start in production mode)
4. Get Firebase config (Project Settings → General → Your apps)
5. Generate Firebase Admin SDK key (Project Settings → Service Accounts → Generate new private key)

### 2. Environment Variables

**Client** (`client/.env`):
```bash
cp client/.env.example client/.env
# Fill in Firebase config values
```

**Server** (`server/.env`):
```bash
cp server/.env.example server/.env
# Fill in Firebase Admin credentials
```

### 3. Run with Docker

```bash
# Build and start all services
docker-compose up --build

# Frontend: http://localhost:5173
# Backend:  http://localhost:5000
```

### 4. Run Locally (without Docker)

**Client:**
```bash
cd client
npm install
npm run dev
```

**Server:**
```bash
cd server
npm install
npm run dev
```

---

## 🗄️ Firestore Collections

- `users/` - User profiles
- `asteroids/` - Cached asteroid data
- `watchlist/` - User watchlists
- `alerts/` - Alert configurations
- `notifications/` - Generated notifications
- `chatMessages/` - Real-time chat

---

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/sessionLogin` - Create session
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/me` - Get current user

### Asteroids
- `GET /api/asteroids/feed` - Get current feed
- `GET /api/asteroids/:neoId` - Get specific asteroid
- `GET /api/asteroids/browse` - Browse catalog

### Watchlist (Protected)
- `GET /api/watchlist` - Get user's watchlist
- `POST /api/watchlist/:neoId` - Add to watchlist
- `DELETE /api/watchlist/:neoId` - Remove from watchlist

### Alerts (Protected)
- `GET /api/alerts` - Get user's alerts
- `POST /api/alerts` - Create alert
- `DELETE /api/alerts/:id` - Delete alert

### Notifications (Protected)
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/:id` - Mark as read

---

## 🎨 Features

### Core Features (Required)
- ✅ User Authentication (Google Sign-In)
- ✅ Real-Time NASA Data Feed
- ✅ Risk Analysis Engine
- ✅ Alert & Notification System
- ✅ Docker Deployment

### Bonus Features
- 🌟 3D Orbital Visualization
- 💬 Real-time Discussion Threads

---

## 📁 Project Structure

```
orbitra/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API services
│   │   └── config/        # Firebase config
│   └── Dockerfile
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/        # Firebase Admin
│   │   ├── middleware/    # Auth middleware
│   │   ├── routes/        # API routes
│   │   ├── services/      # NASA service
│   │   └── utils/         # Helpers
│   └── Dockerfile
│
└── docker-compose.yml
```

---

## 🔒 Security

- Firebase Authentication with Google Sign-In
- HTTP-only session cookies
- CORS protection
- Environment variable management
- Token verification on all protected routes

---

## 🛠️ Development

```bash
# Install dependencies
cd client && npm install
cd ../server && npm install

# Run tests (when available)
npm test

# Build for production
npm run build
```

---

## 📝 License

MIT License - Built for IITB Hackathon 2025

---

## 👥 Team

Jyotiranjan Das (jyoti.r.das845@gmail.com)

---

## 🌟 Acknowledgments

- NASA NeoWs API
- Firebase Platform
- React Three Fiber community
