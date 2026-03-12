import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { publicEnv } from '@/lib/env';

function getFirebaseConfig() {
    const e = publicEnv();
    return {
        apiKey: e.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: e.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: e.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: e.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: e.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: e.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
}

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (typeof window !== 'undefined') {
    app = getApps().length === 0 ? initializeApp(getFirebaseConfig()) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
}

export { app, auth, db, storage };
