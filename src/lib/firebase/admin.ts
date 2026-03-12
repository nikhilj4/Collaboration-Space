import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import { env } from '@/lib/env';

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;
let adminStorage: Storage;

function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    const e = env();
    return initializeApp({
        credential: cert({
            projectId: e.FIREBASE_PROJECT_ID,
            clientEmail: e.FIREBASE_CLIENT_EMAIL,
            privateKey: e.FIREBASE_PRIVATE_KEY,
        }),
        storageBucket: e.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
}

adminApp = getAdminApp();
adminAuth = getAuth(adminApp);
adminDb = getFirestore(adminApp);
adminStorage = getStorage(adminApp);

export { adminApp, adminAuth, adminDb, adminStorage };
