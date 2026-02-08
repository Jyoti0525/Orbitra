// Firebase Admin SDK Configuration
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try service-account-key.json first, fall back to env vars (for cloud deployment)
const serviceAccountPath = join(__dirname, '../../service-account-key.json');
let credential;

if (existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  credential = admin.credential.cert(serviceAccount);
} else if (process.env.FIREBASE_PRIVATE_KEY_BASE64) {
  // Base64-encoded key (safest for cloud platforms like Render)
  const privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
  credential = admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey,
  });
} else if (process.env.FIREBASE_PRIVATE_KEY) {
  // Raw key with escaped newlines
  credential = admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  });
} else {
  throw new Error('No Firebase credentials found. Provide service-account-key.json or FIREBASE_* env vars.');
}

admin.initializeApp({ credential });

// Export Firebase Admin services
export const auth = admin.auth();
export const db = admin.firestore();

// Firestore settings
db.settings({ ignoreUndefinedProperties: true });

export default admin;
