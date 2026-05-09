# AGENTS.md

How AI coding agents (Claude Code, Codex CLI, etc.) coordinate work on this repo.

**Read this first** at the start of every session. It is short on purpose.
For the full reusable playbook, see [`docs/agent-collaboration-template.md`](docs/agent-collaboration-template.md).

---

## The five rules

1. **No direct commits to `main`.** Everything goes through a PR. CI must be green before merge. Branch protection is enabled on `main` (see [`.github/branch-protection-recommended.md`](.github/branch-protection-recommended.md)).
2. **Branch naming signals ownership.** Use `claude/<topic>`, `codex/<topic>`, or `human/<topic>`. Commit messages use Conventional Commits prefixes: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
3. **Use git worktrees so each agent has its own working tree.** Same `.git`, separate directories, separate `node_modules`, no file-system collisions.
4. **Issues are the work queue.** Open a GitHub issue per unit of work. Apply `agent:claude`, `agent:codex`, `agent:either`, or `human` to claim it. Reference it in the PR body with `Closes #N`.
5. **Small PRs, fast merges.** Aim for under 500 LOC and under 24 hours. Long-lived branches accumulate conflicts.

---

## Startup checklist

Every agent starts by running:

```bash
git fetch --prune origin
git status --short --branch
git pull --ff-only origin main
gh pr list --state open --json number,title,headRefName,files,labels
gh issue list --state open --json number,title,labels,assignees
git worktree list
```

Then claim the issue with:

- agent label
- branch name
- expected file scope
- hot zones touched
- research needed: yes/no

Worktree pattern:

```bash
git switch main
git pull --ff-only origin main
git switch -c codex/<short-topic>
git worktree add ../singapore-property-simulator-codex-<short-topic> codex/<short-topic>
```

---

## File ownership

The agent that opens a PR touching a file **owns that file until the PR merges**. Another agent should not start a parallel PR on the same file without commenting on the first PR/issue and getting agreement.

To check what is in flight:

```bash
gh pr list --state open --json number,title,headRefName,files
```

### Rough split for this repo

| Domain | Files |
|---|---|
| Pure engine: financial math | `src/engine/cpf.ts`, `src/engine/stampDuty.ts`, `src/engine/ltv.ts`, `src/engine/finance.ts`, `src/engine/constants.ts` |
| Pure engine: actions / turn | `src/engine/actions.ts`, `src/engine/turn.ts`, `src/engine/selectors.ts`, `src/engine/results.ts`, `src/engine/rng.ts` |
| Game store / types | `src/game/useGameStore.ts`, `src/game/types.ts` |
| Data tables | `src/data/properties.ts`, `src/data/careers.ts`, `src/data/districts.ts`, `src/data/eras.ts`, `src/data/scenarios.ts`, `src/data/saveSchema.ts`, `src/data/buyerOptions.ts` |
| Pages / UI | `src/pages/*.tsx`, `src/pages/dashboard/**`, `src/pages/property/**`, `src/components/**` |
| Tests | Co-located with the file under test. Own the test when you own the file. |
| Playwright smoke / scripts | `scripts/playtest-*.mjs` |
| Always shared | `package.json`, `package-lock.json`, `CHANGELOG.md`, `README.md`, `AGENTS.md`, `.github/**` |

---

## Hot zones

- **`package-lock.json`**: only one open PR at a time may modify it. Add the `deps:locked` label when your PR touches lockfile or `package.json`.
- **`CHANGELOG.md` `[Unreleased]` section**: conflicts will happen. Resolve by keeping both sides; never delete another agent's entry.
- **`src/data/saveSchema.ts`** and **`src/game/types.ts`**: changes ripple. Prefer additive optional fields. Breaking schema changes need a migration note and `SAVE_VERSION` decision.
- **`src/engine/constants.ts`**: tunable parameters. Coordinate balance changes and cite current sources for policy/rule updates.
- **`.github/**`, `AGENTS.md`, and `docs/agent-collaboration-template.md`**: repo process files. Keep changes focused and explain enforcement impact in the PR.

---

## Research standard

Use research whenever the task depends on current facts, external APIs, platform behavior, security, finance rules, or Singapore policy.

- Prefer primary sources: official GitHub docs, official package docs, or Singapore government/statutory sources.
- Link sources in the issue or PR.
- Add `Last checked: YYYY-MM-DD`.
- State whether implementation is exact, simplified, or game-balanced.
- Add tests when a researched rule can regress.

---

## PR checklist

Before requesting merge:

- [ ] No open PR is touching the same files.
- [ ] Linked the closing issue.
- [ ] Marked which agent authored the work.
- [ ] `npm run lint` clean.
- [ ] `npm test` passes.
- [ ] `npm run build` clean.
- [ ] If gameplay changed: `npm run test:smoke`, `npm run test:profiles`, or `npm run test:scroll` exercised.
- [ ] If UI changed: browser route(s) tested and noted.
- [ ] If research was needed: sources and last-checked date included.
- [ ] CHANGELOG `[Unreleased]` updated if user-visible.
- [ ] Did not modify files outside declared scope without coordinating.

---

## When something goes wrong

- **Both agents touched the same file**: whoever opened the PR first merges first; the second rebases.
- **Lockfile conflict**: rebase, run `npm install`, verify lockfile, force-push only the feature branch.
- **CI red on existing failures**: file an issue and fix separately instead of mixing it into unrelated work.
- **Old save broke after schema change**: update save schema and migration. Do not ship schema changes without a migration path.
- **Smoke fails after UI change**: update the affected `scripts/playtest-*.mjs` selector in the same PR.
- **Unclaimed overlapping work appears**: stop, comment on the issue/PR, and either narrow scope or wait for the owner.
- **Direct `main` work happened by accident**: stop, create a branch from current state, push as PR, and do not keep stacking work on `main`.

---

## Release process

Releases are managed manually.

1. Update `## [Unreleased]` in `CHANGELOG.md`, then rename it to `## [X.Y.Z] - YYYY-MM-DD`.
2. Add a new empty `## [Unreleased]` section above it.
3. Update the version in `package.json` and `package-lock.json`.
4. Update the version badge in `README.md`.
5. Open a PR titled `chore: cut X.Y.Z release` and merge it.

### Version bump guide

| Change type | Bump |
|---|---|
| New player-visible feature | Minor, e.g. `0.6.0` to `0.7.0` |
| Bug fix or rules correction | Patch, e.g. `0.6.0` to `0.6.1` |
| Breaking save schema change | Minor, always ship a migrator |

---

This document evolves. If the workflow is not working, propose changes in a PR labeled `meta`.
