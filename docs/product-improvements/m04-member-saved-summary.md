# M04 Member Saved — design pass summary

**Branch:** `fix/member-saved-layout`  
**Files:** `src/pages/CustomerSaved.tsx`  
**Ship:** push + production deploy

## Design changes

- Loading gate until first saved-posts page + creator bookmarks resolve
- `text-heading` / `text-support` / `text-ui`; quieter Free/Premium/Locked badges
- Tab chips `min-h-11`; posts count shows `+` when more pages available
- Solid empties → Feed / Discover CTAs `min-h-11`
- Remove / View creator / View Profile / Load more `min-h-11`; in-flight remove guards
- Locked premium copy stays honest when content is redacted server-side

## Bugs fixed

| Severity | Issue | Fix |
|----------|--------|-----|
| Low | Tiny tabs / remove / profile controls | `min-h-11` |
| Low | Double-remove while in flight | Guard `removingPostId` / `removingCreatorId` |

## Checks

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| ESLint touched file | PASS |
| Browser screenshots | NOT_RUN |

## Preserved

`listSavedDetailedPage` pagination, `listCreatorBookmarksDetailed`, toggle save/bookmark mutations, entitlement-redacted premium content, Feed and Discover recovery links.
