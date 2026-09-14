# Prizelet product experience — review notes

**Branch:** `feature/prizelet-product-experience`  
**Production baseline:** `fix/support-broadcast-readonly` @ `00808cc` (newest shipped tip powering www.prizelet.com via manual `vercel --prod`; GitHub default `production`/`main` lag behind).

## Prizelet purpose (grounded)

Prizelet is private creator infrastructure: creators publish gated content/products, members subscribe via Stripe, admins operate trust/ops. It is not a public “club marketplace” like DubClub; discovery and subscriptions must stay honest to published creators, list prices, and access status.

## Reference observations (DubClub)

| URL | Observation | Auth barrier |
|-----|-------------|--------------|
| https://dubclub.win/subscriptions/ | Hub: promo strip, **Subscriptions** list with recent posts per club, **Manage**, **For You** sidebar | Page loaded while signed in on reference account — signed-out empty state unverified |
| https://dubclub.win/ | Games grid + Find a Club search/filters, club cards with reviews/ratings | Public |
| https://dubclub.win/find-a-club/ | Same discovery surface as homepage Find a Club | Public |

Unverified behind payment/auth: checkout, cancel flows, club admin tools.

## Comparison → shipped in this branch

| Reference pattern | Prizelet before | Impact | Change | Priority |
|-------------------|-----------------|--------|--------|----------|
| Club profile from discovery | Landing/Creators linked to `/c/:username` but app only served `/:username` | Broken discovery → profile | Canonical `creatorProfilePath` + `/c/:username` redirect | P0 |
| Find a Club directory | Public `/discover` and `/top-creators` were stubs; SEO claimed fabricated leaderboard metrics | Dead ends / trust risk | Real `/discover`; `/top-creators` → discover; honest SEO | P0 |
| Subscriptions with recent posts | Billing rows only (status/price/cancel) | Weak “what am I paying for?” | Subscription cards show up to 3 recent posts + Feed CTA | P1 |
| For You recommendations | No suggestions beside billing | Harder to grow second subscription | Suggested creators from published roster minus current subs | P1 |
| Clear Manage + Explore CTAs | Billing portal button only | Unclear next action | Manage billing + Find creators | P1 |
| Nav discovery entry | Network/Creators only | Discover hard to find | Navbar/Footer Discover | P2 |

## Backlog (not in this branch)

- Sport/category filters (Prizelet lacks DubClub-style taxonomy in schema)
- Games/plays aggregation surface
- Review ratings (do not invent)
- Promo campaign banners without real campaign data
- Public Network page depth

## Deploy safety

- Do **not** run `vercel --prod` for this branch.
- Push creates GitHub Preview commits only when Git integration is connected; production alias stays on last manual prod deploy.
- Local: worktree + existing `npx convex dev` / Vite against **dev** Convex (`combative-mongoose-559`).
