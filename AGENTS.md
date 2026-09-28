<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **wizzlet-waqas** (6692 symbols, 14565 relationships, 443 execution flows).

> Index stale? Run `node .gitnexus/run.cjs analyze --index-only` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? Bootstrap with `npx`, `bunx`, or `pnpm dlx` — e.g. `bunx gitnexus@latest analyze` (npm 11 npx crash; #1939).

## Always Do

- **MUST run impact before editing.** Use `impact({target: "symbolName", direction: "upstream"})` or `node .gitnexus/run.cjs impact "symbolName" --direction upstream --repo .`; report callers, processes, and risk. Never substitute grep for graph analysis.
- **MUST analyze graph changes before committing.** Use `detect_changes({scope: "all"})` (MCP) or `node .gitnexus/run.cjs detect-changes --scope all --repo .` (CLI fallback). `partial: true` or `truncated: true` is not a clean check — a zero means unseen, not unaffected; re-run it. For regression review: `detect_changes({scope: "compare", base_ref: "main"})` or `node .gitnexus/run.cjs detect-changes --scope compare --base-ref "main" --repo .`.
- MUST warn on HIGH/CRITICAL `risk` pre-edit; never use `riskSharedAxes` to waive a HIGH/CRITICAL `risk` warning. Compare File/symbol: MCP File omits axes; Graph-RAG expands File.
- **MUST treat `risk: UNKNOWN` as unresolved, not as low.** An empty caller set is not evidence the symbol is unused — it can also mean the callers are not resolvable by the index (plain-object property access, dynamic dispatch, cross-language calls). `impact` pairs `UNKNOWN` with a `riskNote` saying so. Confirm with a text search before treating the symbol as safe to change or delete; do not proceed on the strength of a zero.
- **MUST use `query({search_query: "concept"})` for concepts/flows, `context({name: "symbolName"})` for a named symbol, or `impact` for blast radius, on read-only callers, dependencies, imports, or execution flow.** Graph first; text search only for empty/`UNKNOWN`/literals.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method before MCP/CLI impact analysis.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis, and never read `UNKNOWN` as an all-clear — it means the walk could not answer, which is the one verdict that requires confirming by other means.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit before MCP/CLI graph change analysis.

## Resources

| Resource | Use for |
| --- | --- |
| `gitnexus://repo/wizzlet-waqas/context` | Codebase overview, check index freshness |
| `gitnexus://repo/wizzlet-waqas/clusters` | All functional areas |
| `gitnexus://repo/wizzlet-waqas/processes` | All execution flows |
| `gitnexus://repo/wizzlet-waqas/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
| --- | --- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

<!-- awesome-design-md:start -->
# Awesome DESIGN.md

Brand design systems are vendored from [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md).

- Catalog index: `vendor/awesome-design-md/CATALOG.md`
- Agent skill: `.cursor/skills/awesome-design-md/SKILL.md`
- Refresh: `npm run design-md:sync`

When the user asks for UI "like [brand]", read that brand's `DESIGN.md` before designing. Do not replace Prizelet/Sweeph product chrome unless they explicitly activate a brand.
<!-- awesome-design-md:end -->

<!-- impeccable:start -->
# Impeccable

Design craft skill from [impeccable.style](https://impeccable.style/) ([pbakaus/impeccable](https://github.com/pbakaus/impeccable)).

- Skill: `.cursor/skills/impeccable/SKILL.md`
- Product context: `PRODUCT.md`
- Hooks: `.cursor/hooks.json` (`preToolUse` design detector + GitNexus `postToolUse`)
- Refresh: `npm run impeccable:sync`
- Detect: `npm run impeccable:detect -- src/`
- In chat: `/impeccable polish`, `/impeccable audit`, `/impeccable init`, …

Prefer PO fidelity and existing Sweeph/Prizelet tokens for product screens; use Impeccable to remove AI slop and raise craft inside that system.
<!-- impeccable:end -->

<!-- taste-skill:start -->
# Taste Skill

Anti-slop frontend skills from [tasteskill.dev](https://www.tasteskill.dev/) ([Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)).

- Canonical install: `.agents/skills/` (+ `skills-lock.json`)
- Cursor mirrors: `.cursor/skills/design-taste-frontend` (v2 default), plus style/image variants
- Refresh: `npm run taste-skill:sync`

**Primary:** `design-taste-frontend` (v2) for new marketing/landing work.  
**Product UI:** prefer `design-fidelity-qa` + Impeccable polish inside Sweeph/Prizelet tokens; use `redesign-existing-projects` only when the user asks for a redesign audit.

Other installs: `minimalist-ui`, `high-end-visual-design`, `industrial-brutalist-ui`, `stitch-design-taste`, `image-to-code`, `gpt-taste`, `full-output-enforcement`, imagegen/brandkit skills.
<!-- taste-skill:end -->
