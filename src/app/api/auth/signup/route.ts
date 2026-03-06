import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and number'),
    full_name: z.string().min(2).max(100),
    role: z.enum(['creator', 'brand']),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const data = signupSchema.parse(body);
        const supabase = await createClient();

        const { data: authData, error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: { full_name: data.full_name, role: data.role },
                emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
            },
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Set role in users table
        if (authData.user) {
            await supabase.from('users').update({ role: data.role }).eq('id', authData.user.id);
        }

        return NextResponse.json({
            message: 'Check your email to confirm your account',
            user_id: authData.user?.id,
        });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: err.issues[0].message }, { status: 422 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
