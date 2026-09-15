# Findings

Evidence confidence: **High** = confirmed by code path; **Medium** = likely from static pattern; **Low** = suspected.

---

## F-001 — Client-controlled sandbox checkout gate

| | |
|--|--|
| Severity | **P0** |
| Confidence | High |
| Workflow | Subscribe / cancel |
| Environment | Any deployment exposing these mutations |
| Evidence | `convex/payments/sandbox.ts` args `allowSandbox`; `src/lib/stripe.ts` sends client boolean |

**Expected:** Server env (or internal-only) gates free sandbox activation.  
**Observed:** Any authenticated client can pass `allowSandbox: true` and receive `status: "active"` subscription + paymentEvents.  
**Impact:** Unlimited free premium access; fake revenue events.  
**Smallest fix:** Remove boolean arg; read Convex env `ALLOW_SANDBOX_CHECKOUT` in an action wrapper, or restrict to `internalMutation` + admin.  
**Regression test:** Authenticated user with `allowSandbox: true` must fail when env unset.

---

## F-002 — Public `createSubscriptionRecord` grants arbitrary active subs

| | |
|--|--|
| Severity | **P0** |
| Confidence | High |
| Workflow | Commerce |
| Evidence | `convex/subscriptions/mutations.ts` `createSubscriptionRecord` |

**Expected:** Only payment webhook / internal sandbox path creates active subscriptions.  
**Observed:** Authenticated user may insert subscription for self with any `status` / `amountCents`. Not used by UI today, but public.  
**Fix:** Convert to `internalMutation`; call only from trusted payment path.

---

## F-003 — `subscriptions.setStatus` allows owner to reactivate

| | |
|--|--|
| Severity | **P0** |
| Confidence | High |
| Evidence | `convex/subscriptions/mutations.ts` `setStatus` |

**Expected:** Status transitions constrained (e.g. cancel only for owner; activate only payment/admin).  
**Observed:** Owner can patch `status` to `"active"`.  
**Fix:** Enum + transition matrix; owner limited to cancel/request-cancel.

---

## F-004 — Premium entitlement uses JWT subject as user id

| | |
|--|--|
| Severity | **P1** |
| Confidence | High |
| Workflow | Public creator profile premium posts |
| Evidence | `convex/lib/entitlements.ts`; `posts/queries.ts` `listPreviewsByCreator` |

**Expected:** Resolve viewer via `getAuthUserId` (or split `subject` on `|`).  
**Observed:** Full `userId|sessionId` cast to `Id<"users">` fails lookup → subscribers do not unlock premium on profile previews. `memberFeed` correctly uses `user._id`.  
**Impact:** Paying users may not see premium content on `/:username`; inconsistent with feed.

---

## F-005 — Public migration mutations can mint admin

| | |
|--|--|
| Severity | **P1** |
| Confidence | High |
| Evidence | `convex/migrations/importBatch.ts` |

**Expected:** ETL is `internal*` only.  
**Observed:** Secret-gated public mutations; secret leak ⇒ full import including admin roles.  
**Fix:** `internalMutation`; rotate secret; remove from client API.

---

## F-006 — Promo/link upsert IDOR on update

| | |
|--|--|
| Severity | **P1** |
| Confidence | High |
| Evidence | `convex/creators/growth.ts` upsert by id without creator ownership check |

**Fix:** Load document; assert `creatorId` matches caller’s creator before patch.

---

## F-007 — Public creator document over-exposure

| | |
|--|--|
| Severity | **P2** |
| Confidence | High |
| Evidence | `creators/queries.ts` `getByUsername` returns full doc |

**Fix:** Explicit public projection (username, displayName, bio, avatar, price, publish flags).

---

## F-008 — `files.getUrl` unauthenticated

| | |
|--|--|
| Severity | **P2** |
| Confidence | High |
| Evidence | `convex/files/storage.ts` |

Storage IDs unguessable; still no ACL. Prefer auth + ownership or store only public URLs after upload.

---

## F-009 — Payout request without balance check

| | |
|--|--|
| Severity | **P2** |
| Confidence | High |
| Evidence | `payouts/mutations.ts` `requestPayout` |

---

## F-010 — No Stripe webhook / live payment path

| | |
|--|--|
| Severity | **P2** (product) / **P0** if marketed as live payments |
| Confidence | High |
| Evidence | `PAYMENTS_MODE = 'sandbox'`; no webhook HTTP handler |

---

## F-011 — Missing `returns` validators on public functions

| | |
|--|--|
| Severity | **P2** |
| Confidence | High |

---

## F-012 — Unbounded `.collect()` on admin aggregates

| | |
|--|--|
| Severity | **P2** |
| Confidence | Medium |

---

## F-013 — Deployment data empty vs migration claims

| | |
|--|--|
| Severity | **P1** (data) |
| Confidence | Medium–High (MCP inference) |
| Evidence | All tables `inferredSchema: Never` on dev |

---

## F-014 — `Date.now()` in events query

| | |
|--|--|
| Severity | **P3** |
| Confidence | High |

---

## F-015 — Typecheck errors in admin/customer pages

| | |
|--|--|
| Severity | **P3** |
| Confidence | High |
| Evidence | `tsc --noEmit -p tsconfig.app.json` failures (Id casts, CustomerSaved predicate) |

---

## Suspected / not confirmed

- Messaging creator→any subscriberId without active-sub check (P2 candidate) — static.  
- Click inflation via `recordLinkClick` — low business impact.
