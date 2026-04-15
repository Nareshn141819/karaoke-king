/**
 * Run this script ONCE to set Firebase Storage CORS policy
 * so photo uploads work from the browser.
 *
 * Usage:
 *   node set-storage-cors.mjs
 *
 * Requirements:
 *   - You must be logged in to Firebase CLI: `npx firebase-tools login`
 *   - The firebase-admin package must be installed (run: npm install firebase-admin)
 *
 * Or install @google-cloud/storage:
 *   npm install @google-cloud/storage
 */

// Alternative: Use the Firebase CLI fetch with access token approach
import { execSync } from 'child_process';
import https from 'https';

const BUCKET = 'karoke-king.firebasestorage.app';

const CORS_CONFIG = [
  {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5000',
      'https://karaoke-king-v2.vercel.app',
      '*'
    ],
    method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    responseHeader: [
      'Content-Type',
      'Authorization',
      'Content-Length',
      'x-goog-resumable',
      'User-Agent'
    ],
    maxAgeSeconds: 3600
  }
];

async function getAccessToken() {
  try {
    // Try to get token from gcloud
    const token = execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
    return token;
  } catch {
    try {
      // Try firebase-tools token
      const token = execSync('npx firebase-tools login:ci --no-localhost', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
      return token;
    } catch {
      throw new Error('Cannot get access token. Run: gcloud auth login  OR  npx firebase-tools login');
    }
  }
}

async function setCors(token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ cors: CORS_CONFIG });
    const options = {
      hostname: 'storage.googleapis.com',
      path: `/storage/v1/b/${encodeURIComponent(BUCKET)}?fields=cors`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ CORS configured successfully!');
          console.log(body);
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

try {
  console.log('🔐 Getting access token...');
  const token = await getAccessToken();
  console.log('📡 Setting CORS policy on Firebase Storage...');
  await setCors(token);
} catch (e) {
  console.error('❌ Error:', e.message);
  console.log('\n📋 Manual fix:');
  console.log('1. Go to: https://console.cloud.google.com/storage/browser/karoke-king.firebasestorage.app');
  console.log('2. Click on the bucket → Configuration → CORS');
  console.log('3. Or use Firebase Console → Storage → Rules and set:');
  console.log(`
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}`);
  console.log('\n4. Alternatively install gcloud CLI from: https://cloud.google.com/sdk/docs/install');
  console.log('   Then run:');
  console.log('   gcloud auth login');
  console.log(`   gcloud storage buckets update gs://${BUCKET} --cors-file=cors.json`);
}
