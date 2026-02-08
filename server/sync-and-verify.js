
import dotenv from 'dotenv';
import fs from 'fs';
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
dotenv.config({ path: join(__dirname, '.env') });

console.log('Syncing credentials from .env to service-account-key.json...');

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// Handle escaped newlines from .env string
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
}

console.log(`Project ID: ${projectId}`);
console.log(`Client Email: ${clientEmail}`);
console.log(`Private Key Length: ${privateKey ? privateKey.length : 0}`);

if (!projectId || !clientEmail || !privateKey) {
    console.error('ERROR: Missing variables in .env');
    process.exit(1);
}

const serviceAccount = {
    type: "service_account",
    project_id: projectId,
    private_key_id: "unknown",
    private_key: privateKey,
    client_email: clientEmail,
    client_id: "unknown",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`
};

const jsonPath = join(__dirname, 'service-account-key.json');
fs.writeFileSync(jsonPath, JSON.stringify(serviceAccount, null, 2));
console.log(`Updated ${jsonPath}`);

// Now Verify
console.log('\nVerifying new configuration...');

try {
    if (admin.apps.length) {
        await admin.app().delete(); // cleanup if needed, though usually valid only on re-runs
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    const db = admin.firestore();
    const collections = await db.listCollections();
    console.log('SUCCESS: Connected to Firestore.');
    console.log('Found collections:', collections.map(c => c.id).join(', ') || '(none)');
} catch (error) {
    console.error('FAILURE: Error connecting/reading from Firestore:');
    console.error(error.message);
    if (error.code) console.error(`Error Code: ${error.code}`);
}
