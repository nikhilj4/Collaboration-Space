'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, db } from './firebase/client';
import {
    onAuthStateChanged,
    signOut as firebaseSignOut,
    type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export type UserRole = 'creator' | 'brand' | 'admin';

export interface User {
    id: string;
    email?: string;
    full_name: string;
    username?: string;
    avatar_url?: string;
    role: UserRole;
    onboarding_completed: boolean;
}

interface CreatorProfile {
    id: string;
    social_score: number;
    bio?: string;
    location?: string;
    categories: string[];
}

interface BrandProfile {
    id: string;
    brand_name: string;
    logo_url?: string;
    industry?: string;
}

interface AuthState {
    user: User | null;
    creatorProfile: CreatorProfile | null;
    brandProfile: BrandProfile | null;
    isLoading: boolean;
    isLoggedIn: boolean;

    setUser: (u: User | null) => void;
    setCreatorProfile: (p: CreatorProfile | null) => void;
    setBrandProfile: (p: BrandProfile | null) => void;
    setLoading: (v: boolean) => void;

    loadSession: () => Promise<void>;
    signOut: () => Promise<void>;
    initAuthListener: () => () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            creatorProfile: null,
            brandProfile: null,
            isLoading: true,
            isLoggedIn: false,

            setUser: (u) => set({ user: u, isLoggedIn: !!u }),
            setCreatorProfile: (p) => set({ creatorProfile: p }),
            setBrandProfile: (p) => set({ brandProfile: p }),
            setLoading: (v) => set({ isLoading: v }),

            loadSession: async () => {
                set({ isLoading: true });
                const firebaseUser = auth?.currentUser;
                if (!firebaseUser) {
                    set({ user: null, isLoggedIn: false, isLoading: false });
                    return;
                }
                await fetchAndSetUser(firebaseUser, set);
            },

            signOut: async () => {
                await firebaseSignOut(auth);
                set({
                    user: null,
                    creatorProfile: null,
                    brandProfile: null,
                    isLoggedIn: false,
                });
                // Clear session cookie
                await fetch('/api/auth/session', { method: 'DELETE' });
            },

            initAuthListener: () => {
                if (!auth) return () => {};
                const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                    if (firebaseUser) {
                        await fetchAndSetUser(firebaseUser, set);
                    } else {
                        set({ user: null, isLoggedIn: false, isLoading: false });
                    }
                });
                return unsubscribe;
            },
        }),
        { name: 'nova-auth', partialize: (s) => ({ user: s.user, isLoggedIn: s.isLoggedIn }) }
    )
);

// Helper: fetch user doc from Firestore and set state
async function fetchAndSetUser(
    firebaseUser: FirebaseUser,
    set: (partial: Partial<AuthState>) => void
) {
    try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

        if (userDoc.exists()) {
            const profile = { id: firebaseUser.uid, ...userDoc.data() } as User;
            set({ user: profile, isLoggedIn: true });

            if (profile.role === 'creator') {
                const cpDoc = await getDoc(doc(db, 'creator_profiles', firebaseUser.uid));
                if (cpDoc.exists()) {
                    set({ creatorProfile: { id: firebaseUser.uid, ...cpDoc.data() } as CreatorProfile });
                }
            }
            if (profile.role === 'brand') {
                const bpDoc = await getDoc(doc(db, 'brand_profiles', firebaseUser.uid));
                if (bpDoc.exists()) {
                    set({ brandProfile: { id: firebaseUser.uid, ...bpDoc.data() } as BrandProfile });
                }
            }
        } else {
            // Auth exists but no Firestore doc yet (between signup & onboarding)
            set({
                user: {
                    id: firebaseUser.uid,
                    email: firebaseUser.email ?? undefined,
                    full_name: firebaseUser.displayName ?? '',
                    role: 'creator',
                    onboarding_completed: false,
                },
                isLoggedIn: true,
            });
        }
    } catch {
        set({ user: null, isLoggedIn: false });
    } finally {
        set({ isLoading: false });
    }
}
