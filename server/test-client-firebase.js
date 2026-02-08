// Test if client Firebase credentials are valid
import dotenv from 'dotenv';
dotenv.config({ path: '../client/.env' });

console.log('\n🔍 Testing Client Firebase Configuration\n');

console.log('Firebase Config:');
console.log('  API Key:', process.env.VITE_FIREBASE_API_KEY ? '✅ Present' : '❌ Missing');
console.log('  Auth Domain:', process.env.VITE_FIREBASE_AUTH_DOMAIN || '❌ Missing');
console.log('  Project ID:', process.env.VITE_FIREBASE_PROJECT_ID || '❌ Missing');
console.log('  Storage Bucket:', process.env.VITE_FIREBASE_STORAGE_BUCKET || '❌ Missing');
console.log('  Messaging Sender ID:', process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '❌ Missing');
console.log('  App ID:', process.env.VITE_FIREBASE_APP_ID || '❌ Missing');

console.log('\n📊 Comparison with Server Firebase:');
dotenv.config({ path: '.env' });
console.log('  Server Project ID:', process.env.FIREBASE_PROJECT_ID || '❌ Missing');
console.log('  Match:', process.env.VITE_FIREBASE_PROJECT_ID === 'orbitra-ede2b' ? '✅ Correct' : '❌ Mismatch');

console.log('\n💡 Next Steps:');
console.log('1. Go to: https://console.firebase.google.com/project/orbitra-ede2b/authentication/providers');
console.log('2. Enable Google Sign-In provider');
console.log('3. Add authorized domain: localhost');
console.log('4. Check Security Rules at: https://console.firebase.google.com/project/orbitra-ede2b/firestore/rules');
