# Prizelet product experience — review notes

**Branch:** `feature/prizelet-product-experience`  
**Production baseline:** `fix/support-broadcast-readonly` @ `00808cc` (newest shipped tip powering www.prizelet.com via manual `vercel --prod`; GitHub default `production`/`main` lag behind).

## Prizelet purpose (grounded)

Prizelet is private creator infrastructure: creators publish gated content/products, members subscribe via Stripe, admins operate trust/ops. It is not a public “club marketplace” like DubClub; discovery and subscriptions must stay honest to published creators, list prices, and access status.

## Wave decision (DubClub-inspired, own logic)

**Scope chosen:** Subscriptions hub + Discover + light profile/success glue.

DubClub lesson kept: connected loop find → offer → pay → **see value in Subscriptions** → manage billing separately.  
Not cloned: Games mix UI, star reviews, partner affiliate “For You”, season passes, campaign banners without real campaigns.

## Reference observations (DubClub)

| URL | Observation | Auth barrier |
|-----|-------------|--------------|
| https://dubclub.win/subscriptions/ | Hub: promo strip, **Subscriptions** list with recent posts per club, **Manage**, **For You** sidebar | Signed-in session available |
| https://dubclub.win/ | Games grid + Find a Club search/filters, club cards with reviews/ratings | Public |
| https://dubclub.win/discover/ | Same discovery surface as homepage Find a Club | Public |

## Comparison → this branch

| Reference pattern | Prizelet before | Change | Priority |
|-------------------|-----------------|--------|----------|
| Club profile from discovery | `/c/:username` links broken | Canonical `creatorProfilePath` + `/c/:username` redirect | P0 |
| Find a Club directory | Stub `/discover` / `/top-creators` | Real `/discover`; redirect top-creators; honest SEO | P0 |
| Subscriptions = recent posts | Billing rows only | Hub cards with skeletons, avatars, last 3 posts, View posts → Feed | P1 |
| Manage lifecycle | Portal button only | Manage billing + Charges/Payment tabs; Active / No access filters | P1 |
| For You ads | None | Suggested creators from published roster minus current subs | P1 |
| Discover subscribed state | Always “View profile” | Active access badge + Open in Subscriptions / View posts | P1 |
| Post-checkout land | Profile / Dashboard | Primary Go to Subscriptions | P1 |
| Profile subscribed CTA | Static Subscribed | Open Subscriptions + View posts + Manage billing | P1 |

## Backlog (explicit non-goals)

- Sport/category filters (no taxonomy in schema)
- Games/plays aggregation surface
- Review ratings (do not invent)
- Promo campaign banners without real campaign data
- Partner affiliate carousel
- Notification preferences panel
- Per-post public detail URLs

## Deploy safety

- Do **not** run `vercel --prod` for this branch.
- Draft PR only; production alias stays on last manual prod deploy.
- Local: worktree + `npx convex dev` / Vite against **dev** Convex (`combative-mongoose-559`).
