import { Scr } from './types';
import { Icon, P_COLOR as P, BG } from './ui';

export default function CreateMenu({ go }: { go: (s: Scr, id?: string) => void }) {
    const items = [
        { icon: 'add_a_photo', title: 'Post', sub: 'Share social content with your followers', to: 'post-creator' as Scr },
        { icon: 'work', title: 'Gig', sub: 'List your influencer services for brands', to: 'gig-builder' as Scr },
        { icon: 'campaign', title: 'Campaign', sub: 'Create a sponsorship campaign for creators', to: 'campaign-builder' as Scr },
    ];
    return (
        <div style={{ position: 'relative', height: '100dvh', width: '100%', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
            <div style={{ position: 'absolute', inset: '0 0 0 0', bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <div style={{ background: '#231028', borderRadius: '28px 28px 0 0', borderTop: `1px solid ${P}30` }}>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                        <div style={{ width: 40, height: 4, borderRadius: 4, background: '#444' }} />
                    </div>
                    <div style={{ padding: '0 24px 8px' }}>
                        <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Create New</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {items.map(item => (
                                <button key={item.title} onClick={() => go(item.to)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 12px', borderRadius: 16, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.2s' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = `${P}12`)}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                    <div style={{ width: 52, height: 52, borderRadius: 14, background: `${P}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Icon n={item.icon} style={{ color: P, fontSize: 26 }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, fontFamily: 'inherit' }}>{item.title}</div>
                                        <div style={{ color: '#888', fontSize: 13, marginTop: 3, fontFamily: 'inherit' }}>{item.sub}</div>
                                    </div>
                                    <Icon n="chevron_right" style={{ color: '#555', fontSize: 22 }} />
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* mini bottom nav */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 72, borderTop: `1px solid ${P}15`, padding: '0 16px 8px' }}>
                        <button onClick={() => go('feed')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}>
                            <Icon n="home" style={{ fontSize: 22 }} /><span style={{ fontSize: 10, fontFamily: 'inherit' }}>Home</span>
                        </button>
                        <button onClick={() => go('discover')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}>
                            <Icon n="search" style={{ fontSize: 22 }} /><span style={{ fontSize: 10, fontFamily: 'inherit' }}>Explore</span>
                        </button>
                        <button onClick={() => go('feed')} style={{ width: 56, height: 56, borderRadius: '50%', background: P, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 20px ${P}60`, marginTop: -20 }}>
                            <Icon n="close" style={{ color: '#fff', fontSize: 26 }} />
                        </button>
                        <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}>
                            <Icon n="forum" style={{ fontSize: 22 }} /><span style={{ fontSize: 10, fontFamily: 'inherit' }}>Inbox</span>
                        </button>
                        <button onClick={() => go('profile')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}>
                            <Icon n="person" style={{ fontSize: 22 }} /><span style={{ fontSize: 10, fontFamily: 'inherit' }}>Profile</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
