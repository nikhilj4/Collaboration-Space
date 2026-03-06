'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import FeedScreen from './screens/Feed';
import DiscoverScreen from './screens/Discover';
import CreateMenu from './screens/CreateMenu';
import CampaignsScreen from './screens/Campaigns';
import NotificationsScreen from './screens/Notifications';
import ProfileScreen from './screens/Profile';
import AnalyticsScreen from './screens/Analytics';
import GigBuilder from './screens/GigBuilder';
import BrandBuilder from './screens/BrandBuilder';
import PostCreator from './screens/PostCreator';
import CampaignBuilder from './screens/CampaignBuilder';
import WalletScreen from './screens/Wallet';
import MessagingScreen from './screens/Messaging';
import WithdrawalScreen from './screens/Withdrawal';
import GigDetailScreen from './screens/GigDetail';
import CampaignDetailScreen from './screens/CampaignDetail';
import PostCommentsScreen from './screens/PostComments';
import type { Scr } from './screens/types';

export default function App() {
  const { isLoggedIn, isLoading, loadSession, user } = useAuthStore();
  const [s, setS] = useState<Scr>('feed');
  const [detailId, setDetailId] = useState<string>('');
  const router = useRouter();

  // go(screen) or go(screen, id) for detail screens
  const go = (x: Scr, id?: string) => {
    if (id) setDetailId(id);
    setS(x);
  };

  useEffect(() => { loadSession(); }, [loadSession]);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) router.push('/auth/login');
    if (!isLoading && isLoggedIn && !user?.onboarding_completed) router.push('/onboarding');
  }, [isLoading, isLoggedIn, user, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100dvh', background: '#1f1022', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 40 }}>✦</div>
        <div style={{ width: 40, height: 40, border: '3px solid #4a2d52', borderTop: '3px solid #d125f4', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isLoggedIn) return null;

  // Typed go for detail screens — cast to allow optional id param
  const goTyped = go as (x: Scr, id?: string) => void;

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh', background: '#1f1022', position: 'relative', overflow: 'hidden' }}>
      {s === 'feed' && <FeedScreen go={goTyped} />}
      {s === 'discover' && <DiscoverScreen go={goTyped} />}
      {s === 'create-menu' && <CreateMenu go={goTyped} />}
      {s === 'gig-builder' && <GigBuilder go={goTyped} />}
      {s === 'brand-builder' && <BrandBuilder go={goTyped} />}
      {s === 'campaigns' && <CampaignsScreen go={goTyped} />}
      {s === 'notifications' && <NotificationsScreen go={goTyped} />}
      {s === 'profile' && <ProfileScreen go={goTyped} />}
      {s === 'analytics' && <AnalyticsScreen go={goTyped} />}
      {s === 'post-creator' && <PostCreator go={goTyped} />}
      {s === 'campaign-builder' && <CampaignBuilder go={goTyped} />}
      {s === 'wallet' && <WalletScreen go={goTyped} />}
      {s === 'messaging' && <MessagingScreen go={goTyped} />}
      {s === 'withdrawal' && <WithdrawalScreen go={goTyped} />}
      {s === 'gig-detail' && <GigDetailScreen gigId={detailId} go={goTyped} />}
      {s === 'campaign-detail' && <CampaignDetailScreen campaignId={detailId} go={goTyped} />}
      {s === 'post-comments' && <PostCommentsScreen postId={detailId} go={goTyped} />}
    </div>
  );
}
