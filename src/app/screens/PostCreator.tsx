'use client';
import { useState, useRef } from 'react';
import { Scr } from './types';
import { Icon, P_COLOR as P, BG, BORDER } from './ui';
import { useAuthStore } from '@/lib/store';
import { uploadCampaignMedia } from '@/lib/upload';

const inp = {
    width: '100%', background: `${P}0a`, border: `1px solid ${BORDER}`,
    borderRadius: 12, padding: '13px 15px', color: '#eee', fontSize: 14,
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const,
};

export default function PostCreator({ go }: { go: (s: Scr, id?: string) => void }) {
    const { user } = useAuthStore();
    const [caption, setCaption] = useState('');
    const [hashtags, setHashtags] = useState('');
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploadProgress, setUploadProgress] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    function pickFiles(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []).slice(0, 4);
        setMediaFiles(files);
        setPreviews(files.map(f => URL.createObjectURL(f)));
        setUploadProgress(new Array(files.length).fill(0));
    }

    function removeFile(i: number) {
        setMediaFiles(prev => prev.filter((_, j) => j !== i));
        setPreviews(prev => prev.filter((_, j) => j !== i));
        setUploadProgress(prev => prev.filter((_, j) => j !== i));
    }

    async function submit() {
        if (!caption.trim() && mediaFiles.length === 0) {
            setError('Add a caption or media.');
            return;
        }
        if (!user?.id) {
            setError('Not authenticated. Please log in again.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. Upload files to Firebase Storage
            const mediaUrls: string[] = [];
            const postId = `${user.id}-${Date.now()}`;

            for (let i = 0; i < mediaFiles.length; i++) {
                const file = mediaFiles[i];
                const url = await uploadCampaignMedia(postId, file, (progress) => {
                    setUploadProgress(prev => {
                        const next = [...prev];
                        next[i] = progress;
                        return next;
                    });
                });
                mediaUrls.push(url);
            }

            // 2. Determine media type
            const mediaType = mediaFiles[0]?.type.startsWith('video') ? 'video' : 'image';

            // 3. Parse hashtags
            const tags = hashtags.trim()
                .split(/[\s,#]+/)
                .filter(t => t)
                .map(t => t.replace(/^#/, ''));

            // 4. Save post via API route (Admin SDK — no client auth needed)
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    caption: caption.trim(),
                    hashtags: tags,
                    media_urls: mediaUrls,
                    media_type: mediaType,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Failed to publish post.');

            setSuccess(true);
            setTimeout(() => go('feed'), 1200);
        } catch (e: unknown) {
            console.error('Post error:', e);
            setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div style={{ minHeight: '100dvh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <div style={{ fontSize: 56 }}>🚀</div>
                <h2 style={{ fontSize: 22, fontWeight: 700 }}>Post Published!</h2>
                <p style={{ color: '#888', fontSize: 14 }}>Going back to your feed…</p>
            </div>
        );
    }

    const totalProgress = uploadProgress.length > 0
        ? Math.round(uploadProgress.reduce((a, b) => a + b, 0) / uploadProgress.length)
        : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: BG, fontFamily: "'Spline Sans', sans-serif" }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${BORDER}40` }}>
                <button onClick={() => go('feed')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' }}>
                    <Icon n="close" style={{ fontSize: 22 }} />
                </button>
                <span style={{ fontWeight: 700, fontSize: 18 }}>New Post</span>
                <button onClick={submit} disabled={loading} style={{ padding: '8px 20px', background: P, border: 'none', borderRadius: 20, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }}>
                    {loading ? (uploadProgress.length > 0 ? `${totalProgress}%` : '…') : 'Post'}
                </button>
            </header>

            {/* Upload progress bar */}
            {loading && uploadProgress.length > 0 && (
                <div style={{ height: 3, background: `${P}20` }}>
                    <div style={{ height: '100%', width: `${totalProgress}%`, background: P, transition: 'width 0.2s' }} />
                </div>
            )}

            <main style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
                {/* Media picker */}
                <div>
                    <input ref={fileRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={pickFiles} />
                    {previews.length === 0 ? (
                        <button onClick={() => fileRef.current?.click()} style={{ width: '100%', aspectRatio: '16/9', background: `${P}08`, border: `2px dashed ${P}40`, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', color: P }}>
                            <Icon n="add_photo_alternate" style={{ fontSize: 48 }} />
                            <span style={{ fontWeight: 600, fontSize: 14 }}>Add Photos or Video</span>
                            <span style={{ fontSize: 12, color: '#555' }}>Up to 4 files</span>
                        </button>
                    ) : (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: previews.length === 1 ? '1fr' : '1fr 1fr', gap: 8 }}>
                                {previews.map((src, i) => {
                                    const isVideo = mediaFiles[i]?.type.startsWith('video');
                                    return (
                                        <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', background: `${P}15` }}>
                                            {isVideo
                                                ? <video src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                : <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                            {/* Per-file upload progress overlay */}
                                            {loading && uploadProgress[i] < 100 && (
                                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{uploadProgress[i]}%</span>
                                                </div>
                                            )}
                                            <button onClick={() => removeFile(i)} disabled={loading} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                                                <Icon n="close" style={{ fontSize: 16 }} />
                                            </button>
                                        </div>
                                    );
                                })}
                                {previews.length < 4 && !loading && (
                                    <button onClick={() => fileRef.current?.click()} style={{ aspectRatio: '1', background: `${P}08`, border: `1px dashed ${P}40`, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: P, gap: 4 }}>
                                        <Icon n="add" style={{ fontSize: 28 }} />
                                        <span style={{ fontSize: 11, fontWeight: 600 }}>Add more</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Caption */}
                <div>
                    <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Caption</label>
                    <textarea
                        style={{ ...inp, minHeight: 100, resize: 'vertical' as const }}
                        placeholder="What's on your mind? Share your story with brands and followers…"
                        value={caption}
                        onChange={e => setCaption(e.target.value)}
                        maxLength={2000}
                    />
                    <span style={{ fontSize: 11, color: '#555' }}>{caption.length}/2000</span>
                </div>

                {/* Hashtags */}
                <div>
                    <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Hashtags</label>
                    <input
                        style={inp}
                        placeholder="#fashion #travel #creator"
                        value={hashtags}
                        onChange={e => setHashtags(e.target.value)}
                    />
                    <span style={{ fontSize: 11, color: '#555', marginTop: 4, display: 'block' }}>
                        {hashtags.trim().split(/[\s,#]+/).filter(t => t).length} tags
                    </span>
                </div>

                {/* Tag preview */}
                {hashtags.trim() && (
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                        {hashtags.split(/[\s,#]+/).filter(t => t).map(t => (
                            <span key={t} style={{ background: `${P}18`, color: P, fontSize: 13, fontWeight: 600, padding: '4px 10px', borderRadius: 8 }}>#{t}</span>
                        ))}
                    </div>
                )}

                {error && <p style={{ color: '#f87171', fontSize: 13, background: '#f8717115', padding: '10px 14px', borderRadius: 8 }}>{error}</p>}
            </main>
        </div>
    );
}
