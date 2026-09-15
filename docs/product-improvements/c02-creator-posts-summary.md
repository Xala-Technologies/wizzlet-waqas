# C02 Creator Posts — design pass summary

**Branch:** `fix/creator-posts-editor` (from `fix/creator-posts-layout`)  
**Files:** `src/pages/CreatorPosts.tsx`, `src/lib/postContent.ts`, `src/lib/postContent.test.ts`  
**Ship:** local only (no push/deploy)

## Design changes

- Hierarchy: header → lean KPI strip → list/empty (create mode kept full-page)
- Semantic type tokens (`text-heading`, `text-support`, `text-ui`, `text-title-lg`)
- Removed duplicate win rate from subtitle; honest “Loaded picks” vs totals when paginated
- Larger tap targets for settle/edit/delete; tighter empty state

## Editor form pass

- Single bordered column (`max-w-2xl`) with section dividers instead of four nested cards
- Title / notes use standard bordered inputs (not borderless)
- Header CTA: **Publish Pick** (create) / **Save changes** (edit); same upsert
- Compact review line (title · Free/Premium · pick/odds) above sticky/desktop primary action
- Visibility is a switch row, not a card-in-card
- Empty Sport/Pick type Selects use `value={… || undefined}` (placeholder-only when unset)
- Mobile sticky primary CTA + taller spacer so review line stays clear
- Success dialog copy unchanged

## Bugs fixed

| Severity | Issue | Fix |
|----------|--------|-----|
| Medium | KPIs showed 0 before first page loaded | Full-page loading gate |
| Low | Unused `subs` query blocked load | Removed from page |
| High | Edit wiped sport/event/pick/odds | `parsePostContent` restores fields |
| Medium | Silent save without creator | Error toast |
| Medium | Delete without confirm | AlertDialog |
| Low | Controlled Select `value=""` when unset | Placeholder-only / conditional value |

## Checks

| Check | Result |
|-------|--------|
| `vitest` `postContent.test.ts` | PASS (2) |
| `tsc --noEmit` | PASS |
| ESLint touched files | PASS |
| Browser screenshots | NOT_RUN (no auth session) |

## Preserved

Result lock, win-rate formula, premium toggle, odds sync, tracker-separation copy, upsert contract (no separate draft-save).
