import admin from 'firebase-admin';
import { readFileSync } from 'fs';

console.log('Testing Firebase Admin SDK...\n');

// Load service account key
const serviceAccountPath = './service-account-key.json';
console.log(`Loading service account from: ${serviceAccountPath}`);
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

console.log(`Project ID: ${serviceAccount.project_id}`);
console.log(`Client Email: ${serviceAccount.client_email}\n`);

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('✅ Firebase Admin initialized successfully\n');
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  process.exit(1);
}

// Test Firestore access
const db = admin.firestore();
console.log('Testing Firestore access...');

try {
  // Try to get a collection reference
  const testRef = db.collection('test');
  console.log('✅ Firestore collection reference created\n');

  // Try to read from Firestore
  console.log('Attempting to read from Firestore...');
  const snapshot = await testRef.limit(1).get();
  console.log(`✅ Firestore read successful. Documents found: ${snapshot.size}\n`);

  // Try to write to Firestore
  console.log('Attempting to write to Firestore...');
  await testRef.add({
    test: true,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    message: 'Test from Firebase Admin SDK'
  });
  console.log('✅ Firestore write successful\n');

  console.log('🎉 All Firebase Admin tests passed!');
  process.exit(0);
} catch (error) {
  console.error('❌ Firestore operation failed:');
  console.error(`Error code: ${error.code}`);
  console.error(`Error message: ${error.message}\n`);

  if (error.code === 16 || error.message.includes('UNAUTHENTICATED')) {
    console.log('This error indicates the service account does not have proper permissions.');
    console.log('Please check the following:');
    console.log('1. The service account has the "Firebase Admin SDK Administrator Service Agent" role');
    console.log('2. The Firebase project ID matches: orbitra-ede2b');
    console.log('3. The service account key is valid and not expired');
    console.log('4. Firestore is enabled in the Firebase Console');
  }

  process.exit(1);
}
