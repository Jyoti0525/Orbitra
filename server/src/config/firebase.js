// Firebase Admin SDK Configuration
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Export Firebase Admin services
export const auth = admin.auth();
export const db = admin.firestore();

// Firestore settings
db.settings({ ignoreUndefinedProperties: true });

export default admin;
