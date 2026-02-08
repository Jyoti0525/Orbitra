// Check Firestore permissions by testing a simple write operation
import { db } from './src/config/firebase.js';

async function checkPermissions() {
  console.log('🔍 Checking Firestore permissions...\n');

  try {
    // Test 1: Try to write to Firestore
    console.log('Test 1: Writing test document...');
    const testRef = await db.collection('_test').add({
      test: true,
      timestamp: new Date(),
    });
    console.log('✅ WRITE permission: OK - Document ID:', testRef.id);

    // Test 2: Try to read from Firestore
    console.log('\nTest 2: Reading test document...');
    const doc = await testRef.get();
    console.log('✅ READ permission: OK - Data:', doc.data());

    // Test 3: Try to delete from Firestore
    console.log('\nTest 3: Deleting test document...');
    await testRef.delete();
    console.log('✅ DELETE permission: OK');

    console.log('\n🎉 All Firestore permissions are working correctly!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Firestore permission error:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('\nFull error:', error);

    if (error.code === 7 || error.message.includes('PERMISSION_DENIED')) {
      console.log('\n💡 Fix: The service account needs these roles in Google Cloud IAM:');
      console.log('   - Cloud Datastore User');
      console.log('   - OR Firebase Admin SDK Administrator Service Agent');
      console.log('\n📍 Go to: https://console.cloud.google.com/iam-admin/iam?project=orbitra-ede2b');
    } else if (error.code === 16 || error.message.includes('UNAUTHENTICATED')) {
      console.log('\n💡 Fix: The service account credentials may be invalid or missing roles');
      console.log('   Current service account:', process.env.FIREBASE_CLIENT_EMAIL);
    }

    process.exit(1);
  }
}

checkPermissions();
