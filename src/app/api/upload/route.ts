import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase/admin';
import { AuthError, requireSession } from '@/lib/api/auth';
import { rateLimit } from '@/lib/api/rateLimit';
import { jsonError, jsonOk } from '@/lib/api/http';

export async function POST(request: NextRequest) {
    try {
        const rl = await rateLimit(request, { keyPrefix: 'upload', max: 20, window: '60 s' });
        if (!rl.ok) {
            return NextResponse.json(
                { error: 'Too many uploads. Please try again shortly.' },
                { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
            );
        }

        await requireSession(request);

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const path = formData.get('path') as string | null;

        if (!file || !path) {
            return jsonError('file and path are required.', 400);
        }

        // Basic server-side validation to avoid abuse
        const maxBytes = 25 * 1024 * 1024; // 25MB
        if (typeof (file as any).size === 'number' && (file as any).size > maxBytes) {
            return jsonError('File too large (max 25MB).', 413);
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

        return jsonOk({ url: publicUrl });
    } catch (err: any) {
        if (err instanceof AuthError) return jsonError(err.message, err.status, { code: err.code });
        console.error('Upload error:', err);
        return jsonError(err?.message ?? 'Upload failed.', 500);
    }
}
