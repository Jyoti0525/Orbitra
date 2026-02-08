
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account key directly to be sure
const serviceAccountPath = join(__dirname, 'service-account-key.json');
console.log(`Loading key from: ${serviceAccountPath}`);

try {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  console.log(`Project ID from key: ${serviceAccount.project_id}`);
  console.log(`Client Email from key: ${serviceAccount.client_email}`);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  console.log('Attempting to connect to Firestore...');
  const db = admin.firestore();
  
  // Try a simple read operation
  // listing collections requires 'Cloud Datastore User' or similar permissions
  const collections = await db.listCollections();
  console.log('SUCCESS: Connected to Firestore.');
  console.log('Found collections:', collections.map(c => c.id).join(', ') || '(none)');

} catch (error) {
  console.error('FAILURE: Error connecting/reading from Firestore:');
  console.error(error.message);
  if (error.code) console.error(`Error Code: ${error.code}`);
}
