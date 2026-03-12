import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminStorage } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get('nova_session')?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        }

        await adminAuth.verifySessionCookie(sessionCookie, true);

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const path = formData.get('path') as string | null;

        if (!file || !path) {
            return NextResponse.json({ error: 'file and path are required.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const bucket = adminStorage.bucket();
        const fileRef = bucket.file(path);

        await fileRef.save(buffer, {
            metadata: {
                contentType: file.type,
                cacheControl: 'public, max-age=31536000',
            },
        });

        await fileRef.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;

        return NextResponse.json({ url: publicUrl });
    } catch (err: any) {
        console.error('Upload error:', err);
        return NextResponse.json({ error: err.message ?? 'Upload failed.' }, { status: 500 });
    }
}
