'use client';
export type Screen = 'feed' | 'discover' | 'create-menu' | 'gig-builder' | 'brand-builder' | 'campaigns' | 'profile' | 'analytics' | 'notifications' | 'advanced-filters';

export function Icon({ name, filled = false, cls = '' }: { name: string; filled?: boolean; cls?: string }) {
    return (
        <span className={`material-symbols-outlined ${cls}`}
            style={{ fontVariationSettings: filled ? "'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24" : "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24" }}>
            {name}
        </span>
    );
}

export function BottomNav({ active, go }: { active: string; go: (s: Screen) => void }) {
    return (
        <nav className="fixed bottom-0 z-50 w-full max-w-[430px] bg-[#120a18] border-t border-white/5">
            <div className="flex items-center justify-around h-[72px] px-2 pb-2">
                {[
                    { id: 'feed', icon: 'home', label: 'Home' },
                    { id: 'discover', icon: 'explore', label: 'Discover' },
                    { id: 'create-menu', icon: 'add', label: 'Create', center: true },
                    { id: 'notifications', icon: 'notifications', label: 'Activity' },
                    { id: 'profile', icon: 'person', label: 'Profile' },
                ].map(t => t.center ? (
                    <button key="create" onClick={() => go('create-menu')} className="flex flex-col items-center -mt-5">
                        <div className="size-14 rounded-full bg-[#d125f4] flex items-center justify-center shadow-lg shadow-[#d125f4]/40">
                            <Icon name="add" cls="text-white text-3xl" />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1">Create</span>
                    </button>
                ) : (
                    <button key={t.id} onClick={() => go(t.id as Screen)}
                        className={`flex flex-col items-center gap-0.5 transition-colors ${active === t.id ? 'text-[#d125f4]' : 'text-slate-600 hover:text-slate-400'}`}>
                        <Icon name={t.icon} filled={active === t.id} cls="text-[22px]" />
                        <span className="text-[10px] font-medium">{t.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}
