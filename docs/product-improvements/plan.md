# Product improvements — Phase 1 plan map

**Branch:** `fix/product-excellence-phase1`  
**Baseline commit:** `2c2ef56` (Merge PR #28 dark-mode clarity)  
**Authority:** IMPLEMENT_AND_VERIFY (local/isolated only; no prod deploy)

| Gap | Roles | Files | Acceptance |
|-----|-------|-------|------------|
| Entitlement matrix vs `status === "active"` only | Member, creator messaging, premium posts | `convex/lib/contentAccess.ts`, `convex/lib/auth.ts`, `convex/lib/entitlements.ts`, messaging/posts callers | Access matches matrix in decisions.md; past_due denies; cancel_pending allows until period end |
| Email change dead-end | Member (settings) | `convex/accountRequests.ts`, schema `accountRequests`, `CustomerSettings.tsx` | Authenticated request creates open case + audit; no fake email mutation |
| Settled result rewrite | Creator public record | `posts.setResult`, `picks.upsert`, CreatorPosts UI, `computeWinRate` | Non-pending results locked (`RESULT_LOCKED`); win rate excludes push |
| Onboarding one-shot publish | Creator | `CreatorOnboarding.tsx`, `upsertOnboarding`, schema `onboardingStep` | Draft save/resume; explicit publish; already-published preserved |
| Homes lack next tasks | All roles | Dashboard / CreatorDashboard / AdminDashboard | Real-state “Next up” links only |

Later phases (out of scope): discover rewrite, Playwright matrix, notification digests, MFA, Vercel promote.
