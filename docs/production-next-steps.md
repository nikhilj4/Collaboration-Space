# Production Next Steps (Firebase-First)

This repo is already on the right track (Next.js App Router + Firebase session cookies + Firestore). To make it **production-grade**, focus on: **security**, **reliability**, **performance**, and **operational maturity**.

## Immediate must-fix (high risk)

### Remaining Supabase dependencies (migration not complete)
The following routes still use Supabase clients and/or Supabase Auth. If you deploy “Firebase-only” without migrating these, you’ll ship broken flows or hidden data inconsistencies:

- **Auth**
  - `src/app/api/auth/callback/route.ts` (Supabase OAuth callback/session exchange)
  - `src/app/api/auth/otp/route.ts` (Supabase phone OTP)
- **Marketplace / Payments**
  - `src/app/api/orders/route.ts` (gig orders + verify uses Supabase)
  - `src/app/api/payments/verify/route.ts` (Supabase escrow/transactions)
- **Discovery / Marketplace**
  - `src/app/api/campaigns/route.ts` (campaign CRUD via Supabase)
  - `src/app/api/gigs/route.ts` (gigs + packages via Supabase)
  - `src/app/api/creators/route.ts` (creator profiles via Supabase)
- **Scoring / AI**
  - `src/app/api/social-score/route.ts` (writes `creator_profiles` via Supabase)
  - `src/app/api/ai/match/route.ts` (reads campaigns/creators via Supabase)

**Recommendation**: pick ONE of these paths:

- **Path A (preferred)**: migrate each route to Firestore + Firebase Auth (recommended for long-term)
- **Path B**: temporarily disable these routes in production (return `501 Not Implemented`) so you don’t ship half-migrated flows

## What we hardened in this pass

- **Env validation (Zod)**: `src/lib/env.ts` (server + public env parsing; Firebase private key newline normalization)
- **Shared API primitives**
  - Session verification helper: `src/lib/api/auth.ts` (`requireSession()`)
  - Rate limiting (Upstash, no-op if not configured): `src/lib/api/rateLimit.ts`
  - Consistent JSON responses: `src/lib/api/http.ts`
- **Refactored Firebase-backed routes** to use the shared helpers:
  - `src/app/api/auth/session/route.ts`
  - `src/app/api/auth/onboarding/route.ts`
  - `src/app/api/feed/route.ts`
  - `src/app/api/posts/route.ts`
  - `src/app/api/upload/route.ts`
  - `src/app/api/profile/posts/route.ts`
- **Security headers**: `next.config.ts` (HSTS in production, nosniff, frame deny, referrer, permissions policy)

## Firebase migration checklist (per capability)

### 1) Auth consolidation
- **Keep**: Firebase Auth (email/password + Google)
- **Use**: your existing `nova_session` cookie pattern everywhere server-side
- **Replace**:
  - Supabase OAuth callback flow → Firebase OAuth already exists client-side; remove `api/auth/callback`
  - Supabase phone OTP → either Firebase phone auth (client) or a server-driven OTP provider (Resend/SMS provider)

### 2) Data model mapping (Firestore collections)
Suggested Firestore collections to replace Supabase tables:

- `users/{uid}`
- `creator_profiles/{uid}`
- `brand_profiles/{uid}`
- `posts/{postId}`
- `follows/{followerId_followingId}`
- `post_likes/{postId_uid}`
- `post_saves/{postId_uid}`
- `campaigns/{campaignId}`
- `gigs/{gigId}`
- `gig_packages/{packageId}` (or subcollection under `gigs/{gigId}/packages/{packageId}`)
- `gig_orders/{orderId}`
- `wallets/{uid}`
- `transactions/{txId}`
- `social_score_history/{id}`
- `ai_recommendations/{id}`

### 3) Payments / escrow correctness
- Move all payment verification to a single **server-only** webhook/verify endpoint.
- Store:
  - `razorpay_order_id`, `razorpay_payment_id`, `signature`, status transitions
  - immutable transaction ledger entries (`transactions`) rather than “update balance directly”
- Add **idempotency** on verification (don’t double-credit on retries).

### 4) Abuse prevention
- Apply rate limiting to **all** mutation endpoints:
  - uploads, post creation, likes, onboarding, orders, payment verify, messaging
- Add file validation (type/size) on upload (already started).

### 5) Observability
- Add request IDs, structured logs, and error reporting (e.g. Sentry) for API routes.
- Track critical funnels:
  - signup → onboarding complete
  - post create → feed engagement
  - order create → payment verified → escrow → completion

## Deployment readiness checklist

- **Secrets**: all Firebase Admin + Razorpay secrets set in hosting provider
- **Upstash**: `UPSTASH_REDIS_REST_URL/TOKEN` set (or disable rate limiting intentionally)
- **Storage**: bucket configured; confirm `makePublic()` aligns with your privacy model
- **Backups**: Firestore export schedule + restore playbook
- **Access control**: define Firestore/Storage rules even if most access is server-side

