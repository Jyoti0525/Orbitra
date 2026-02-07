# Orbitra Setup Guide

Complete step-by-step guide to get Orbitra running locally.

---

## Prerequisites

- **Node.js** 18+ or 20+ (https://nodejs.org/)
- **Docker** and **Docker Compose** (https://www.docker.com/)
- **Firebase Account** (https://firebase.google.com/)
- **NASA API Key** (already included: `zhybXnOiyWPUxaprhlWbHf4oDl2bCunR1Tvfkbf1`)

---

## Step 1: Firebase Setup (15 minutes)

### 1.1 Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it "orbitra" (or anything you like)
4. Disable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Google Sign-In

1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Click "Sign-in method" tab
4. Enable "Google" provider
5. Set support email
6. Click "Save"

### 1.3 Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Choose "Start in **production mode**"
4. Select location (closest to you)
5. Click "Enable"

### 1.4 Get Firebase Config (for Client)

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps"
3. Click web icon `</>`
4. Register app as "orbitra-client"
5. Copy the config object:

```javascript
{
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
}
```

### 1.5 Generate Firebase Admin SDK Key (for Server)

1. In **Project Settings**, go to "Service accounts" tab
2. Click "Generate new private key"
3. Click "Generate key" (downloads JSON file)
4. Keep this file safe - you'll need it for server .env

---

## Step 2: Clone and Configure

### 2.1 Navigate to Project

```bash
cd /Users/jyotiranjandas/Downloads/iitb-hackathon/orbitra
```

### 2.2 Configure Client Environment

```bash
cd client
cp .env.example .env
nano .env  # or use any text editor
```

Fill in the Firebase config values from Step 1.4:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_API_URL=http://localhost:5000
VITE_NASA_API_KEY=zhybXnOiyWPUxaprhlWbHf4oDl2bCunR1Tvfkbf1
```

### 2.3 Configure Server Environment

```bash
cd ../server
cp .env.example .env
nano .env
```

Fill in using the downloaded service account JSON from Step 1.5:

```env
PORT=5000
NODE_ENV=development

# From the service account JSON file:
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nPaste the entire private_key value here\n-----END PRIVATE KEY-----\n"

# NASA API (already provided)
NASA_API_KEY=zhybXnOiyWPUxaprhlWbHf4oDl2bCunR1Tvfkbf1
NASA_BASE_URL=https://api.nasa.gov/neo/rest/v1

# CORS
ALLOWED_ORIGINS=http://localhost:5173

# Session
SESSION_COOKIE_NAME=session
SESSION_MAX_AGE=432000000
```

**Important:** Make sure to format the `FIREBASE_PRIVATE_KEY` correctly with `\n` for line breaks!

---

## Step 3: Install Dependencies

### 3.1 Client Dependencies

```bash
cd client
npm install
```

This installs:
- React, React Router
- Firebase SDK
- Tailwind CSS
- React Three Fiber (for 3D)
- Axios

### 3.2 Server Dependencies

```bash
cd ../server
npm install
```

This installs:
- Express
- Firebase Admin SDK
- Axios (for NASA API)
- Node-cron (for scheduled jobs)
- Cors, Cookie-parser

---

## Step 4: Run the Application

### Option A: Run with Docker (Recommended)

```bash
# From project root
cd /Users/jyotiranjandas/Downloads/iitb-hackathon/orbitra

# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d
```

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Health check: http://localhost:5000/health

### Option B: Run Locally (Development)

**Terminal 1 - Client:**
```bash
cd client
npm run dev
```

**Terminal 2 - Server:**
```bash
cd server
npm run dev
```

---

## Step 5: Test the Application

### 5.1 Sign In

1. Open http://localhost:5173
2. Click "Sign in with Google"
3. Select your Google account
4. You should be redirected to the dashboard

### 5.2 Test NASA API

1. The dashboard should automatically fetch today's asteroids
2. Check browser console for any errors
3. Check server logs for API calls

### 5.3 Test Backend API

```bash
# Health check
curl http://localhost:5000/health

# Fetch today's asteroids
curl "http://localhost:5000/api/asteroids/feed?start_date=2025-02-07"
```

---

## Step 6: Firestore Security Rules (Optional but Recommended)

1. Go to Firebase Console → Firestore Database
2. Click "Rules" tab
3. Paste the security rules from `FIRESTORE-SCHEMA.md`
4. Click "Publish"

---

## Troubleshooting

### Issue: "Firebase project not found"

**Solution:** Double-check `FIREBASE_PROJECT_ID` in both client and server `.env` files.

### Issue: "Private key error"

**Solution:** Make sure `FIREBASE_PRIVATE_KEY` is properly formatted with `\n` for line breaks. It should start with `-----BEGIN PRIVATE KEY-----\n` and end with `\n-----END PRIVATE KEY-----\n`.

### Issue: "CORS error"

**Solution:** Make sure `ALLOWED_ORIGINS` in server `.env` includes your frontend URL (`http://localhost:5173`).

### Issue: "NASA API rate limit"

**Solution:** The free tier has 1000 requests/hour. If exceeded, wait an hour or register for a higher tier at https://api.nasa.gov.

### Issue: "Cannot connect to server"

**Solution:**
1. Check if server is running on port 5000
2. Check `.env` files are configured correctly
3. Check Firebase credentials are valid

---

## Next Steps

### Add Features

Now that the foundation is set up, you can add features:

1. **Watchlist System** - Implement `watchlist.routes.js` fully
2. **Alert System** - Implement `alerts.routes.js` and alert checking logic
3. **3D Visualization** - Use research from `3d-research/` folder
4. **Real-time Chat** - Use research from `real-discussion/` folder

### Development Workflow

```bash
# Make code changes
# Client hot-reloads automatically
# Server requires restart (or use nodemon for auto-restart)

# Test changes
# Commit to git
git add .
git commit -m "Add feature X"
git push
```

---

## Production Deployment

For hackathon demo:

1. **Build for production:**
   ```bash
   docker-compose up --build
   ```

2. **Deploy to cloud:**
   - Frontend: Vercel, Netlify, or Firebase Hosting
   - Backend: Railway, Render, or Google Cloud Run
   - Database: Already on Firebase (scalable)

3. **Update environment variables** for production URLs

---

## Support

If you run into issues:

1. Check the logs: `docker-compose logs`
2. Review `README.md` for quick reference
3. Check `FIRESTORE-SCHEMA.md` for database structure

---

**You're all set! Start building features! 🚀**
