# AGENTS.md

How AI coding agents (Claude Code, Codex CLI, etc.) coordinate work on this repo.

**Read this first** at the start of every session. It is short on purpose.

---

## The five rules

1. **No direct commits to `main`.** Everything goes through a PR. CI must be green before merge. Branch protection is enabled on `main` (see [`.github/branch-protection-recommended.md`](.github/branch-protection-recommended.md)).

2. **Branch naming signals ownership:** `claude/<topic>` or `codex/<topic>`. Underneath, use Conventional Commits prefixes (`feat`, `fix`, `refactor`, `chore`, `docs`).

3. **Use git worktrees so each agent has its own working tree.** Same `.git`, separate directories, separate `node_modules`, no file-system collisions:
   ```bash
   # From the existing clone:
   git worktree add ../singapore-property-simulator-codex codex/main-tracking
   # Codex works in ../singapore-property-simulator-codex; Claude works in the original.
   git worktree list  # shows all active worktrees
   ```

4. **Issues are the work queue.** Open a GitHub issue per unit of work. Apply `agent:claude` or `agent:codex` to claim it. Reference it in the PR body with `Closes #N`. Don't start work on an issue another agent has claimed.

5. **Small PRs, fast merges.** Aim for <500 LOC and <24 h lifetime. Long-lived branches accumulate conflicts.

---

## File ownership

The agent that opens a PR touching a file **owns that file until the PR merges**. Other agent should not start a parallel PR on the same file. To check what's in flight:

```bash
gh pr list --state open --json number,title,headRefName,files
```

When opening a PR that touches files outside the rough split below, post a comment on any open PR that already touches those files. Whoever started first gets right-of-way.

### Rough split for this repo (adjust as needed):

| Domain | Files |
|---|---|
| Pure engine: financial math | `src/engine/cpf.ts`, `src/engine/stampDuty.ts`, `src/engine/ltv.ts`, `src/engine/finance.ts`, `src/engine/constants.ts` |
| Pure engine: actions / turn | `src/engine/actions.ts`, `src/engine/turn.ts`, `src/engine/selectors.ts`, `src/engine/results.ts`, `src/engine/rng.ts` |
| Game store / types | `src/game/useGameStore.ts`, `src/game/types.ts` |
| Data tables | `src/data/properties.ts`, `src/data/careers.ts`, `src/data/districts.ts`, `src/data/eras.ts`, `src/data/scenarios.ts`, `src/data/saveSchema.ts`, `src/data/buyerOptions.ts` |
| Pages / UI | `src/pages/*.tsx`, `src/pages/dashboard/**`, `src/pages/property/**`, `src/components/**` |
| Tests | Co-located with the file under test (`src/engine/__tests__/`); you own the test if you own the file. |
| Playwright smoke / scripts | `scripts/playtest-*.mjs` |
| Always shared | `package.json`, `package-lock.json`, `CHANGELOG.md`, `README.md`, this file |

---

## Hot zones (extra coordination needed)

- **`package-lock.json`**: only one open PR at a time may modify it. Add the `deps:locked` label when your PR touches lockfile or `package.json`. Wait for it to merge before opening another.
- **`CHANGELOG.md` `[Unreleased]` section**: conflicts will happen and that's OK. Resolve by **keeping both sides** — never delete the other agent's entry. Each PR that's user-visible should add a bullet under the right Added/Changed/Fixed/Improved heading.
- **`src/data/saveSchema.ts`** and **`src/game/types.ts`**: changes here ripple. Prefer additive changes (new optional fields). Breaking schema changes need their own PR with a migration note in the body and a corresponding `SAVE_VERSION` bump if applicable.
- **`src/engine/constants.ts`**: tunable parameters (CPF rates, LTV caps, stamp duty tiers). Coordinate balance changes — two agents tweaking the same constant in parallel will produce unpredictable game balance.

---

## PR checklist (mirror of `.github/PULL_REQUEST_TEMPLATE.md`)

Before requesting merge:

- [ ] `npm run lint` clean
- [ ] `npm test` passes (vitest unit suite)
- [ ] `npm run build` clean
- [ ] If touching gameplay flows: at least one of `npm run test:smoke`, `npm run test:profiles`, `npm run test:scroll` exercised manually
- [ ] CHANGELOG `[Unreleased]` updated if user-visible
- [ ] Linked the closing issue
- [ ] Marked which agent authored (`agent:claude` or `agent:codex`)
- [ ] Did not modify files outside your declared scope without coordinating

---

## When something goes wrong

- **Both agents touched the same file**: whichever PR was opened first merges; second rebases.
- **Lockfile conflict**: rebase, run `npm install`, force-push the rebased branch.
- **CI red on existing failures (not yours)**: file an issue, label it `agent:either`, fix in a separate PR rather than mixing it into yours.
- **Old save broke after schema change**: schema bumps require updating `src/data/saveSchema.ts` plus a save migration. Don't ship schema changes without a migrator.
- **Playwright smoke fails after a UI change**: update the affected `scripts/playtest-*.mjs` selectors in the same PR — never let smoke tests rot.

---

## What goes in `[Unreleased]`

- User-visible behavior changes (new feature, balance change, UI update)
- Save schema changes (always)
- Singapore-realism rule changes (CPF rates, LTV caps, stamp duty tables, ABSD profile rules)
- Performance changes the player can feel

What does **not** need a CHANGELOG entry:

- Refactors that don't change behavior
- Test-only changes
- Internal docs (including this file)
- Lockfile-only updates

---

This document evolves. If the workflow isn't working, propose changes to it in a PR labeled `meta`.
