import { Scr } from './types';
import { Icon, Nav, P_COLOR as P, BG, CARD, BORDER } from './ui';

export default function BrandBuilder({ go }: { go: (s: Scr, id?: string) => void }) {
    const inp = { width: '100%', background: `${P}0a`, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '13px 14px', color: '#eee', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const };
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: BG }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: `1px solid ${BORDER}40`, position: 'sticky', top: 0, background: `${BG}f0`, backdropFilter: 'blur(12px)', zIndex: 10 }}>
                <button onClick={() => go('create-menu')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' }}>
                    <Icon n="arrow_back_ios" style={{ fontSize: 20 }} />
                </button>
                <span style={{ fontWeight: 700, fontSize: 17 }}>Create Brand Page</span>
                <div style={{ width: 28 }} />
            </header>
            <main style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 100px' }}>
                {/* Page Identity */}
                <section style={{ marginBottom: 24 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Page Identity</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
                        <div style={{ width: 100, height: 100, borderRadius: '50%', border: `2px dashed ${P}60`, background: `${P}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon n="person" style={{ fontSize: 48, color: `${P}60` }} />
                        </div>
                        <div style={{ color: '#888', fontSize: 12, marginTop: 8, textAlign: 'center' }}>Brand Logo<br /><span style={{ fontSize: 11, color: '#555' }}>#cc,name,logo | 400x400px | PNG or JPG</span></div>
                        <button style={{ marginTop: 12, padding: '10px 28px', background: P, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Upload Logo</button>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontWeight: 600, fontSize: 15 }}>Cover Image</span>
                            <span style={{ color: P, fontSize: 13, fontWeight: 600 }}>Change</span>
                        </div>
                        <div style={{ border: `1.5px dashed ${P}40`, borderRadius: 12, height: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: `${P}06` }}>
                            <Icon n="add_photo_alternate" style={{ color: `${P}60`, fontSize: 32 }} />
                            <span style={{ color: '#666', fontSize: 12, marginTop: 6 }}>1600x500px suggested</span>
                        </div>
                    </div>
                </section>
                {/* General Info */}
                <section style={{ marginBottom: 24 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>General Information</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                            <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6 }}>Page Name</label>
                            <input style={inp} placeholder="e.g. Lumina Creative Agency" />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6 }}>Website</label>
                            <div style={{ position: 'relative' }}>
                                <Icon n="language" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: 18 } as React.CSSProperties} />
                                <input style={{ ...inp, paddingLeft: 38 }} placeholder="https://yourbrand.com" type="url" />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6 }}>Description</label>
                            <textarea style={{ ...inp, minHeight: 90, resize: 'vertical' as const }} placeholder="Tell us about your brand..." />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6 }}>Category</label>
                                <select style={{ ...inp }}>
                                    {['Marketing', 'Fashion', 'Beauty', 'Tech', 'Food'].map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6 }}>Employees</label>
                                <select style={{ ...inp }}>
                                    {['1-10', '11-50', '51-200', '200+'].map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </section>
                {/* Location */}
                <section style={{ marginBottom: 28 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Location</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                            <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6 }}>Country</label>
                            <select style={{ ...inp }}>
                                <option>United States</option><option>United Kingdom</option><option>India</option>
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6 }}>State/Province</label>
                                <input style={inp} placeholder="California" />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6 }}>City</label>
                                <input style={inp} placeholder="Los Angeles" />
                            </div>
                        </div>
                        <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: P, margin: '8px auto 0', fontFamily: 'inherit' }}>
                            <Icon n="location_on" style={{ color: P, fontSize: 28 }} />
                            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Pin Location</span>
                        </button>
                    </div>
                </section>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 24, cursor: 'pointer' }}>
                    <input type="checkbox" style={{ marginTop: 3, accentColor: P }} />
                    <span style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>I verify that I am an authorized representative of this brand and have the right to create this page.</span>
                </label>
                <button onClick={() => go('campaigns')} style={{ width: '100%', padding: '16px 0', background: P, border: 'none', borderRadius: 14, color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 6px 24px ${P}50` }}>Create Page</button>
                <div style={{ textAlign: 'center', marginTop: 14 }}>
                    <span style={{ color: '#666', fontSize: 13 }}>Need help? <span style={{ color: P }}>Contact support</span></span>
                </div>
            </main>
            <Nav active="feed" go={go} />
        </div>
    );
}
