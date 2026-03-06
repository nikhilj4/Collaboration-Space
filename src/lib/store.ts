import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from './supabase/client';

export type UserRole = 'creator' | 'brand' | 'admin';

interface User {
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
                const supabase = createClient();
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) { set({ user: null, isLoggedIn: false, isLoading: false }); return; }

                    const { data: profile } = await supabase
                        .from('users').select('*').eq('id', user.id).single();

                    if (profile) {
                        set({ user: profile as User, isLoggedIn: true });

                        if (profile.role === 'creator') {
                            const { data: cp } = await supabase
                                .from('creator_profiles').select('*').eq('user_id', user.id).single();
                            set({ creatorProfile: cp as CreatorProfile });
                        }
                        if (profile.role === 'brand') {
                            const { data: bp } = await supabase
                                .from('brand_profiles').select('*').eq('user_id', user.id).single();
                            set({ brandProfile: bp as BrandProfile });
                        }
                    }
                } finally {
                    set({ isLoading: false });
                }
            },

            signOut: async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                set({ user: null, creatorProfile: null, brandProfile: null, isLoggedIn: false });
            },
        }),
        { name: 'nova-auth', partialize: (s) => ({ user: s.user, isLoggedIn: s.isLoggedIn }) }
    )
);
