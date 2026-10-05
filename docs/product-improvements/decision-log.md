# Decision log — page-pack shared contracts

Extends [`decisions.md`](./decisions.md). Page-pack baseline only; no new commercial policy.

## Commercial currency (2026-10-05)

| Concern | Contract |
|---------|----------|
| Product / Checkout / ledger | **USD** (`PRIZELET_LEDGER_CURRENCY`) |
| Connect Express country | **US** (`STRIPE_CONNECT_COUNTRY=US`) while ledger is USD |
| Stripe legal entity | May remain **NO** with `default_currency=nok` settlement |
| Connect Transfer funding | Prefer **matched USD available**. If only settlement currency is available, use **Stripe-native FX**: Transfer in settlement currency sized with Stripe `balance_transaction.exchange_rate`. Never treat NOK øre as USD cents 1:1 |
| NOK pricing migration | Not chosen — out of scope while USD is the platform currency |

## Layout and typography (approved)

| Concern | Contract |
|---------|----------|
| Dashboard widths | Member `max-w-4xl`, creator `max-w-5xl`, admin `max-w-6xl` (`DashboardLayout`) |
| Type roles | `text-body` / `text-ui` / `text-support` / `text-caption` / headings — see `docs/ui/typography-and-spacing.md` |
| Surfaces | Flat solids only; no glass, glow, or decorative gradients |
| Auth pages | Single column `max-w-[380px]` (login/signup) or `max-w-lg` (role); centered; Prizelet logo; one primary CTA |
| Cards | Only for meaningful choice groups (e.g. role options), not nested decoration |
| PageHeader | **Not introduced** for identity group — titles remain page-local (duplication is low) |

## Domain state distinctions (must stay separate)

| State | Must not be conflated with |
|-------|----------------------------|
| Billing / subscription row status | Content access entitlement |
| Payout request | Completed settlement |
| In-app notification | Delivered email |
| Creator draft (`isPublished: false`) | Public profile availability |
| OAuth redirect completed | Session + roles ready |

## Safe return path

- Query param: `returnTo` (relative path only).
- Helper: `src/lib/safeReturnPath.ts`.
- Allow only same-app paths starting with `/` (not `//`).
- Reject external URLs, protocol-relative, and open redirects.
- `/admin` (and nested) only when the authenticated user already holds `admin`.
- After login/callback: prefer safe `returnTo` when user may access it; otherwise `homePathForRole`.
- Protected routes send unauthenticated users to `/login?returnTo=<encoded path+search>`.

## Auth shell alignment

Login, Signup, SelectRole share: `main#main-content`, centered column, logo, `text-support` helper copy, loading disables primary button. SelectRole keeps larger choice cards (task-appropriate). No new auth design language.
