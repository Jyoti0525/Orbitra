# Firestore Database Schema

## Collections Overview

The Orbitra platform uses 6 main Firestore collections to store all data.

---

## 1. `users/`

Stores user profile information from Firebase Auth.

### Document Structure

```javascript
users/{uid}/
  - email: string              // User's email
  - displayName: string        // Full name
  - photoURL: string           // Profile picture URL
  - createdAt: timestamp       // Account creation time
  - preferences: {
      alertsEnabled: boolean,  // Enable/disable alerts
      theme: string            // UI theme preference
    }
```

### Example
```javascript
{
  "email": "john@gmail.com",
  "displayName": "John Doe",
  "photoURL": "https://lh3.googleusercontent.com/...",
  "createdAt": "2025-02-07T12:00:00Z",
  "preferences": {
    "alertsEnabled": true,
    "theme": "dark"
  }
}
```

---

## 2. `asteroids/`

Cached asteroid data from NASA API with calculated risk scores.

### Document Structure

```javascript
asteroids/{neoId}/
  - id: string                    // NASA NEO ID
  - neoId: string                 // Same as document ID
  - name: string                  // Asteroid name (e.g., "(2024 YU4)")
  - nasaJplUrl: string            // Link to NASA JPL
  - absoluteMagnitude: number     // Brightness measure
  - diameterMinKm: number         // Min diameter in km
  - diameterMaxKm: number         // Max diameter in km
  - diameterMinM: number          // Min diameter in meters
  - diameterMaxM: number          // Max diameter in meters
  - isHazardous: boolean          // Potentially hazardous?
  - isSentry: boolean             // On NASA Sentry list?
  - sentryData: string|null       // Link to Sentry data
  - riskScore: number             // 0-100 calculated score
  - riskLevel: string             // "LOW", "MEDIUM", "HIGH"
  - orbitalData: object|null      // Orbital elements (from Lookup)
  - lastFetched: string           // ISO timestamp

  closeApproaches/{epochMs}/      // Subcollection
    - date: string                // "2025-02-07"
    - dateTime: string            // "2025-Feb-07 22:47"
    - epochMs: number             // Unix timestamp
    - velocityKmh: number         // Speed in km/h
    - velocityKms: number         // Speed in km/s
    - missDistanceKm: number      // Distance in km
    - missDistanceAu: number      // Distance in AU
    - missDistanceLunar: number   // Distance in lunar distances
    - orbitingBody: string        // "Earth"
```

### Example
```javascript
{
  "id": "54509624",
  "neoId": "54509624",
  "name": "(2024 YU4)",
  "nasaJplUrl": "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=54509624",
  "absoluteMagnitude": 19.04,
  "diameterMinKm": 0.4136,
  "diameterMaxKm": 0.9248,
  "isHazardous": true,
  "isSentry": false,
  "riskScore": 75,
  "riskLevel": "HIGH",
  "lastFetched": "2025-02-07T12:00:00Z"
}
```

---

## 3. `watchlist/`

User's saved asteroids for monitoring.

### Document Structure

```javascript
watchlist/{watchlistId}/
  - userId: string               // User UID
  - asteroidId: string           // NEO ID
  - addedAt: string              // ISO timestamp
  - alertEnabled: boolean        // Enable alerts for this asteroid
```

### Example
```javascript
{
  "userId": "abc123xyz",
  "asteroidId": "54509624",
  "addedAt": "2025-02-07T12:00:00Z",
  "alertEnabled": true
}
```

### Indexes
- Composite: `userId` + `asteroidId` (for quick lookups)

---

## 4. `alerts/`

User-configured alert rules.

### Document Structure

```javascript
alerts/{alertId}/
  - userId: string               // User UID
  - type: string                 // "hazardous", "distance", "size"
  - threshold: {
      value: number,             // Threshold value
      unit: string               // Unit (e.g., "AU", "km")
    }
  - isActive: boolean            // Alert enabled?
  - createdAt: string            // ISO timestamp
```

### Example
```javascript
{
  "userId": "abc123xyz",
  "type": "distance",
  "threshold": {
    "value": 0.05,
    "unit": "AU"
  },
  "isActive": true,
  "createdAt": "2025-02-07T12:00:00Z"
}
```

---

## 5. `notifications/`

Generated notifications for users.

### Document Structure

```javascript
notifications/{notificationId}/
  - userId: string               // User UID
  - alertId: string              // Associated alert ID
  - asteroidId: string           // NEO ID that triggered alert
  - message: string              // Notification message
  - isRead: boolean              // Has user read it?
  - priority: string             // "high", "medium", "low"
  - createdAt: string            // ISO timestamp
```

### Example
```javascript
{
  "userId": "abc123xyz",
  "alertId": "alert123",
  "asteroidId": "54509624",
  "message": "Hazardous asteroid (2024 YU4) approaching within 0.08 AU!",
  "isRead": false,
  "priority": "high",
  "createdAt": "2025-02-07T12:00:00Z"
}
```

### Indexes
- Composite: `userId` + `isRead` + `createdAt` (for unread notifications query)

---

## 6. `chatMessages/`

Real-time chat messages for discussion threads.

### Document Structure

```javascript
chatMessages/{messageId}/
  - userId: string               // Message author UID
  - userName: string             // Author display name
  - userPhoto: string            // Author photo URL
  - asteroidId: string|null      // Asteroid being discussed (null for general)
  - roomId: string               // "general" or "ast_{neoId}"
  - message: string              // Message text
  - timestamp: timestamp         // Firestore timestamp
  - reactions: {                 // Optional emoji reactions
      "👍": number,
      "🚀": number
    }
```

### Example
```javascript
{
  "userId": "abc123xyz",
  "userName": "John Doe",
  "userPhoto": "https://...",
  "asteroidId": "54509624",
  "roomId": "ast_54509624",
  "message": "This asteroid is huge!",
  "timestamp": Firestore.Timestamp,
  "reactions": {
    "👍": 5,
    "🚀": 2
  }
}
```

### Indexes
- Composite: `roomId` + `timestamp` (for room message queries)

---

## Data Flow

### 1. Asteroid Data Flow
```
NASA API → nasaService.fetchFeed()
  → parseAsteroidData()
  → calculateRiskScore()
  → Save to asteroids/
```

### 2. User Authentication Flow
```
Firebase Auth (Google Sign-In)
  → Create ID token
  → Backend verifies token
  → Create session cookie
  → Save/update users/ collection
```

### 3. Watchlist Flow
```
User adds asteroid
  → Create watchlist/ document
  → Link userId + asteroidId
  → Enable/disable alerts
```

### 4. Alert Generation Flow
```
Cron job runs
  → Fetch asteroids from asteroids/
  → Check against alerts/ rules
  → Generate notifications/ documents
  → User sees in dashboard
```

---

## Security Rules (Recommended)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Asteroids are public (read-only for users)
    match /asteroids/{asteroidId} {
      allow read: if request.auth != null;
      allow write: if false; // Only server can write
    }

    // Watchlist - users can only access their own
    match /watchlist/{watchlistId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    // Alerts - users can only access their own
    match /alerts/{alertId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    // Notifications - users can only read their own
    match /notifications/{notificationId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if false; // Only server can write
    }

    // Chat - authenticated users can read/write
    match /chatMessages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## Performance Optimization

### Caching Strategy
- Asteroid data cached for 24 hours
- Check `lastFetched` before re-fetching from NASA
- Reduces API calls and improves response time

### Indexes
Create these composite indexes in Firebase Console:
1. `watchlist`: (userId, asteroidId)
2. `notifications`: (userId, isRead, createdAt)
3. `chatMessages`: (roomId, timestamp)

---

## Data Retention

- **Asteroids**: Keep for 30 days, auto-delete stale data
- **Watchlist**: Keep until user removes
- **Notifications**: Keep for 90 days
- **Chat**: Keep all messages (or implement retention policy)

---

## Total Storage Estimate

For a typical user monitoring 10 asteroids:
- Users: ~1 KB
- Asteroids: ~500 KB (10 asteroids × 50 KB each)
- Watchlist: ~1 KB
- Alerts: ~1 KB
- Notifications: ~10 KB
- Chat: ~50 KB

**Total per user: ~562 KB**

Firestore free tier: 1 GB storage (supports ~1,780 users)
