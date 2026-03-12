/**
 * Upload a file via the server-side /api/upload route.
 * Uses Firebase Admin SDK — no client-side auth required.
 * @param file  The File object to upload
 * @param path  Storage path e.g. "avatars/uid/profile.jpg"
 * @param onProgress  Optional progress callback — shows 0% then 100% (server upload is atomic)
 */
export async function uploadFile(
    file: File,
    path: string,
    onProgress?: (p: number) => void
): Promise<string> {
    onProgress?.(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Upload failed with status ${res.status}`);
    }

    const data = await res.json();
    onProgress?.(100);
    return data.url as string;
}

/** Upload a user avatar and return the public URL. */
export async function uploadAvatar(uid: string, file: File, onProgress?: (p: number) => void): Promise<string> {
    const ext = file.name.split('.').pop();
    return uploadFile(file, `avatars/${uid}/profile.${ext}`, onProgress);
}

/** Upload a brand logo and return the public URL. */
export async function uploadLogo(uid: string, file: File, onProgress?: (p: number) => void): Promise<string> {
    const ext = file.name.split('.').pop();
    return uploadFile(file, `logos/${uid}/logo.${ext}`, onProgress);
}

/** Upload a post/campaign media file and return the public URL. */
export async function uploadCampaignMedia(
    postId: string,
    file: File,
    onProgress?: (p: number) => void
): Promise<string> {
    const ext = file.name.split('.').pop();
    const name = `${Date.now()}.${ext}`;
    return uploadFile(file, `campaigns/${postId}/${name}`, onProgress);
}
