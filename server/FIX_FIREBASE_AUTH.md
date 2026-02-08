# Firebase Authentication Fix Guide

## Problem Identified

Your server is failing with Firebase/Firestore authentication errors:
```
Error: 16 UNAUTHENTICATED: Request had invalid authentication credentials
```

## Root Cause

The service account key (`service-account-key.json`) does not have proper IAM permissions to access Firestore.

**Current Configuration:**
- Project ID: `orbitra-ede2b`
- Service Account: `firebase-adminsdk-r01lx@orbitra-ede2b.iam.gserviceaccount.com`
- Status: ✅ Server running, ❌ Firestore access failing

## Quick Fix (Recommended)

### Option 1: Download New Service Account Key with Proper Permissions

1. **Open Firebase Console:**
   ```
   https://console.firebase.google.com/project/orbitra-ede2b/settings/serviceaccounts/adminsdk
   ```

2. **Generate New Private Key:**
   - Click "Generate new private key"
   - Save the downloaded JSON file
   - Replace `/Users/jyotiranjandas/Downloads/iitb-hackathon/orbitra/server/service-account-key.json` with the new file

3. **Restart Server:**
   ```bash
   cd /Users/jyotiranjandas/Downloads/iitb-hackathon/orbitra/server
   npm run dev
   ```

### Option 2: Grant IAM Permissions via Google Cloud Console

1. **Open IAM Console:**
   ```
   https://console.cloud.google.com/iam-admin/iam?project=orbitra-ede2b
   ```

2. **Find Service Account:**
   - Search for: `firebase-adminsdk-r01lx@orbitra-ede2b.iam.gserviceaccount.com`

3. **Add Required Roles:**
   - Click "Edit" (pencil icon)
   - Add these roles:
     - `Cloud Datastore User`
     - `Firebase Admin SDK Administrator Service Agent`
   - Click "Save"

4. **Restart Server**

### Option 3: Use gcloud CLI (If Authenticated)

```bash
# Login to gcloud
gcloud auth login

# Set project
gcloud config set project orbitra-ede2b

# Grant permissions
gcloud projects add-iam-policy-binding orbitra-ede2b \
  --member="serviceAccount:firebase-adminsdk-r01lx@orbitra-ede2b.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

# Restart server
cd /Users/jyotiranjandas/Downloads/iitb-hackathon/orbitra/server
npm run dev
```

## Verify Fix

After applying one of the fixes above, test with:

```bash
cd /Users/jyotiranjandas/Downloads/iitb-hackathon/orbitra/server
node test-firebase-admin.js
```

Expected output:
```
✅ Firebase Admin initialized successfully
✅ Firestore collection reference created
✅ Firestore read successful
✅ Firestore write successful
🎉 All Firebase Admin tests passed!
```

## Additional Checks

### 1. Verify Firestore is Enabled

```
https://console.firebase.google.com/project/orbitra-ede2b/firestore
```

Make sure Firestore database is created (not in "Create database" state).

### 2. Verify Firestore API is Enabled

```
https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=orbitra-ede2b
```

Make sure the button says "Manage" (not "Enable").

## What We Fixed

1. ✅ Updated `firebase.js` to load service account from JSON file directly (more reliable)
2. ✅ Verified configuration consistency between client and server (both use `orbitra-ede2b`)
3. ✅ Identified the exact issue: IAM permissions missing for service account
4. ❌ **PENDING:** You need to grant IAM permissions (choose one option above)

## Files Modified

- `/Users/jyotiranjandas/Downloads/iitb-hackathon/orbitra/server/src/config/firebase.js`
  - Changed from environment variables to JSON file
  - More reliable credential loading

## Next Steps

1. Choose one of the 3 options above to grant IAM permissions
2. Run the test script: `node test-firebase-admin.js`
3. Once tests pass, restart your server
4. Your Firebase authentication should now work! 🎉
