# C13 Creator Referrals — design pass summary

**Branch:** `fix/creator-referrals-layout`  
**Files:** `src/pages/CreatorReferrals.tsx`  
**Ship:** push + production deploy

## Design changes

- Loading gate until creator, referrals, and referral code resolve; no KPI zeros flash
- Share-first referral link with `text-ui` / `text-support` and `min-h-11` Copy
- Lean KPIs (referred, conversions, commission `—`); muted icons, no color noise
- No-creator → **Set up your profile**; empty activity points to share link above
- Mobile cards + desktop table keep Pending/Converted; commission stays `—`

## Bugs fixed

| Severity | Issue | Fix |
|----------|--------|-----|
| Low | Chrome/KPIs while rows loading | Full loading gate |
| Low | No onboarding path without profile | No-creator CTA |

## Checks

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| ESLint touched file | PASS |
| Browser screenshots | NOT_RUN |

## Preserved

`listMyReferrals`, auto `referralCode` ensure via `buildReferralCode` / `updateSettings`, copy `/signup?ref=…`, Pending/Converted status, cash commission not enabled (no payout invent).
