import { Scr } from './types';

export function Icon({ n, fill = false, style = {} }: { n: string; fill?: boolean; style?: React.CSSProperties }) {
    return (
        <span className="material-symbols-outlined"
            style={{ fontVariationSettings: fill ? "'FILL' 1" : 'FILL 0', ...style }}>
            {n}
        </span>
    );
}

const P = '#d125f4';

export function Nav({ active, go }: { active: Scr; go: (s: Scr) => void }) {
    const tabs = [
        { id: 'feed' as Scr, icon: 'home', label: 'Home' },
        { id: 'discover' as Scr, icon: 'explore', label: 'Discover' },
        { id: 'create-menu' as Scr, icon: 'add', label: 'Create', center: true },
        { id: 'messaging' as Scr, icon: 'forum', label: 'Messages' },
        { id: 'profile' as Scr, icon: 'person', label: 'Profile' },
    ];
    return (
        <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: '#120a18', borderTop: '1px solid rgba(255,255,255,0.06)', zIndex: 50 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 68, padding: '0 8px 8px' }}>
                {tabs.map(t => t.center ? (
                    <button key="c" onClick={() => go('create-menu')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -20, background: 'none', border: 'none', cursor: 'pointer' }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: P, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 20px ${P}60` }}>
                            <Icon n={active === 'create-menu' ? 'close' : 'add'} style={{ color: '#fff', fontSize: 28 }} />
                        </div>
                        <span style={{ fontSize: 10, color: '#555', marginTop: 2 }}>Create</span>
                    </button>
                ) : (
                    <button key={t.id} onClick={() => go(t.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', color: active === t.id ? P : '#555', transition: 'color 0.2s' }}>
                        <Icon n={t.icon} fill={active === t.id} style={{ fontSize: 22 }} />
                        <span style={{ fontSize: 10, fontWeight: 500, fontFamily: 'inherit' }}>{t.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}

export const P_COLOR = P;
export const BG = '#1f1022';
export const CARD = '#2d1b31';
export const BORDER = '#4a2d52';
