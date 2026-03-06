import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
    phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format (+91XXXXXXXXXX)'),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone } = schema.parse(body);
        const supabase = await createAdminClient();

        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        return NextResponse.json({ message: 'OTP sent successfully' });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: err.issues[0].message }, { status: 422 });
        }
        return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
    }
}
