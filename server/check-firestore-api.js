// Check if we can access Firebase project info
import https from 'https';

const projectId = 'orbitra-ede2b';
const serviceAccountEmail = 'firebase-adminsdk-fbsvc@orbitra-ede2b.iam.gserviceaccount.com';

console.log('Checking Firebase project configuration...\n');
console.log(`Project ID: ${projectId}`);
console.log(`Service Account: ${serviceAccountEmail}\n`);

console.log('DIAGNOSIS:');
console.log('==========\n');

console.log('The service account authentication is working (Firebase Admin SDK initialized)');
console.log('But Firestore operations are failing with UNAUTHENTICATED error.\n');

console.log('This typically means one of the following:\n');

console.log('1. SERVICE ACCOUNT PERMISSIONS (Most Likely):');
console.log('   The service account needs these IAM roles:');
console.log('   - Cloud Datastore User (or Owner)');
console.log('   - Firebase Admin SDK Administrator Service Agent');
console.log('   - Service Account Token Creator (optional)\n');

console.log('2. FIRESTORE NOT ENABLED:');
console.log('   Firestore database may not be initialized in Firebase Console\n');

console.log('3. SERVICE ACCOUNT KEY ISSUES:');
console.log('   - Key might be revoked or expired');
console.log('   - Key might be from a different project\n');

console.log('4. API NOT ENABLED:');
console.log('   Cloud Firestore API might not be enabled for the project\n');

console.log('RECOMMENDED ACTIONS:');
console.log('===================\n');

console.log('Option 1: Grant IAM permissions via gcloud CLI:');
console.log(`   gcloud projects add-iam-policy-binding ${projectId} \\`);
console.log(`     --member="serviceAccount:${serviceAccountEmail}" \\`);
console.log('     --role="roles/datastore.user"\n');

console.log('Option 2: Use Firebase Console:');
console.log('   1. Go to https://console.firebase.google.com/project/orbitra-ede2b/settings/serviceaccounts/adminsdk');
console.log('   2. Generate a new service account key');
console.log('   3. Replace the current service-account-key.json\n');

console.log('Option 3: Grant permissions via Google Cloud Console:');
console.log('   1. Go to https://console.cloud.google.com/iam-admin/iam?project=orbitra-ede2b');
console.log('   2. Find the service account: firebase-adminsdk-r01lx@orbitra-ede2b.iam.gserviceaccount.com');
console.log('   3. Click Edit and add "Cloud Datastore User" role\n');

console.log('Option 4: Enable Firestore API:');
console.log('   1. Go to https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=orbitra-ede2b');
console.log('   2. Click "Enable"\n');

console.log('Would you like me to try accessing Firebase project to check API status? (requires auth)');
