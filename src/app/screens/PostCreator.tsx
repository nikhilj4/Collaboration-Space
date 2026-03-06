'use client';
import { useState, useRef } from 'react';
import { Scr } from './types';
import { Icon, P_COLOR as P, BG, BORDER } from './ui';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';

const inp = {
    width: '100%', background: `${P}0a`, border: `1px solid ${BORDER}`,
    borderRadius: 12, padding: '13px 15px', color: '#eee', fontSize: 14,
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const,
};

export default function PostCreator({ go }: { go: (s: Scr) => void }) {
    const { user } = useAuthStore();
    const [caption, setCaption] = useState('');
    const [hashtags, setHashtags] = useState('');
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    function pickFiles(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []).slice(0, 4);
        setMediaFiles(files);
        setPreviews(files.map(f => URL.createObjectURL(f)));
    }

    function removeFile(i: number) {
        setMediaFiles(prev => prev.filter((_, j) => j !== i));
        setPreviews(prev => prev.filter((_, j) => j !== i));
    }

    async function submit() {
        if (!caption.trim() && mediaFiles.length === 0) { setError('Add a caption or media.'); return; }
        if (!user) return;
        setLoading(true); setError('');

        // Upload media to Supabase Storage
        const mediaUrls: string[] = [];
        for (const file of mediaFiles) {
            const ext = file.name.split('.').pop();
            const path = `posts/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { data, error: uploadErr } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600' });
            if (uploadErr) { setError(`Upload failed: ${uploadErr.message}`); setLoading(false); return; }
            const { data: url } = supabase.storage.from('media').getPublicUrl(data.path);
            mediaUrls.push(url.publicUrl);
        }

        // Determine media type
        const mediaType = mediaFiles[0]?.type.startsWith('video') ? 'video' : 'image';

        // Insert post
        const tags = hashtags.trim().split(/[\s,#]+/).filter(t => t).map(t => t.replace(/^#/, ''));
        const { error: postErr } = await supabase.from('posts').insert({
            user_id: user.id,
            caption: caption.trim(),
            hashtags: tags,
            media_urls: mediaUrls,
            media_type: mediaType,
        });

        if (postErr) { setError(postErr.message); setLoading(false); return; }
        setSuccess(true);
        setTimeout(() => go('feed'), 1200);
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: BG, fontFamily: "'Spline Sans', sans-serif" }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${BORDER}40` }}>
                <button onClick={() => go('feed')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' }}>
                    <Icon n="close" style={{ fontSize: 22 }} />
                </button>
                <span style={{ fontWeight: 700, fontSize: 18 }}>New Post</span>
                <button onClick={submit} disabled={loading} style={{ padding: '8px 20px', background: P, border: 'none', borderRadius: 20, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }}>
                    {loading ? '…' : 'Post'}
                </button>
            </header>

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
                                            <button onClick={() => removeFile(i)} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                                                <Icon n="close" style={{ fontSize: 16 }} />
                                            </button>
                                        </div>
                                    );
                                })}
                                {previews.length < 4 && (
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
