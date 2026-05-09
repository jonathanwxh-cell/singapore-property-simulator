# Parallel Agent Collaboration Template

This is the reusable operating template for running multiple coding agents on the same repository without clobbering each other. `AGENTS.md` is the short required entrypoint; this file is the deeper playbook agents should follow when a task is non-trivial, touches shared files, or requires research.

## Source Principles

This template is based on the current repo workflow plus GitHub platform controls:

- Protected branches can require pull requests, status checks, resolved conversations, linear history, and disabled force pushes/deletions before changes land on important branches: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- Rulesets are a stronger alternative when available because multiple rulesets can apply at once and are easier to discover without admin access: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets
- Issue and pull request templates keep contributors from omitting scope, test evidence, and context: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates
- CODEOWNERS can automatically request review from the responsible owner and can be required by branch protection: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners
- PR descriptions can use closing keywords such as `Closes #123` to connect work to its issue: https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/using-keywords-in-issues-and-pull-requests

## Golden Rule

No agent starts editing until it has:

1. Synced `main`.
2. Checked open PRs.
3. Claimed or created an issue.
4. Declared file scope.
5. Created its own branch and worktree.

If two agents want the same files, the agent with the earlier PR or issue claim gets priority. The second agent must re-scope, wait, or explicitly coordinate in the issue/PR.

## Agent Startup Checklist

Run this before starting work:

```powershell
git fetch --prune origin
git status --short --branch
git pull --ff-only origin main
gh pr list --state open --json number,title,headRefName,files,labels
gh issue list --state open --json number,title,labels,assignees
git worktree list
```

Then record the intended scope in the issue:

```md
Claimed by: agent:codex | agent:claude | human
Branch: codex/<topic> or claude/<topic>
Files expected:
- src/...
- docs/...
Hot zones touched: yes/no
Research required: yes/no
```

## Branch And Worktree Pattern

Use a branch per task and a worktree per active agent:

```powershell
git fetch --prune origin
git switch main
git pull --ff-only origin main
git switch -c codex/<short-topic>
git worktree add ..\singapore-property-simulator-codex-<short-topic> codex/<short-topic>
```

Branch naming:

- `codex/<topic>` for Codex-owned work.
- `claude/<topic>` for Claude-owned work.
- `human/<topic>` for human-only branches.
- `dependabot/...` remains dependency automation.
- `chore/release-x.y.z` for release-only branches.

Do not work directly on `main`, even for tiny changes, unless the repository owner explicitly overrides the process for an emergency.

## File Ownership Matrix

Use this as the default split. A PR owns every file it touches until merge.

| Area | Primary files | Conflict risk | Required coordination |
|---|---|---:|---|
| Finance rules | `src/engine/cpf.ts`, `stampDuty.ts`, `ltv.ts`, `finance.ts`, `constants.ts` | High | Link official/current source for rule changes. |
| Turn/actions/store | `src/engine/actions.ts`, `turn.ts`, `src/game/useGameStore.ts`, `types.ts` | High | Add focused unit tests and save-schema notes. |
| Data/content | `src/data/**` | Medium | Avoid parallel edits to the same large data file. |
| Dashboard/UI pages | `src/pages/**`, `src/components/**` | Medium | Browser-test the affected route. |
| Scripts/smoke | `scripts/playtest-*.mjs` | Medium | Run the changed smoke script. |
| Shared repo files | `package*.json`, `CHANGELOG.md`, `README.md`, `AGENTS.md`, `.github/**` | High | Keep both changelog entries when conflicts happen. |

## Hot Zone Rules

- `package-lock.json`: only one dependency PR at a time. Apply `deps:locked`.
- `CHANGELOG.md`: merge both sides. Never delete another agent's entry.
- `src/data/saveSchema.ts`: breaking changes require a `SAVE_VERSION` decision and migration notes.
- `src/game/types.ts`: prefer additive optional fields.
- `src/engine/constants.ts`: every policy/rule change needs a source and date checked.
- `.github/**` and `AGENTS.md`: treat as coordination infrastructure; keep changes small and explicit.

## Research Protocol

Use research when the task depends on current facts, platform behavior, security, finance rules, policy, or external APIs.

Minimum standard:

1. Prefer primary sources: official docs, government/statutory pages, package docs, release notes.
2. Record links in the issue or PR.
3. Note `Last checked: YYYY-MM-DD`.
4. State whether the implementation is exact, simplified, or intentionally game-balanced.
5. Add tests around the rule or behavior if it can regress.

For Singapore policy realism, do not rely on memory. Verify current CPF, HDB, IRAS, MAS, or URA rules before changing live-rule constants or player-facing policy copy.

## Implementation Contract

Every agent PR should do the smallest complete slice:

1. Write or update tests first when behavior changes.
2. Implement the feature/fix.
3. Update UI copy/docs/changelog if user-visible.
4. Run the relevant checks.
5. Browser-test rendered UX when UI changes.
6. Open a PR with evidence.
7. Clean up branch/worktree after merge.

Required commands for most PRs:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Add one of these when relevant:

```powershell
npm.cmd run test:smoke
npm.cmd run test:profiles
npm.cmd run test:scroll
```

## PR Evidence Template

Paste this into PR descriptions when the default template is not enough:

```md
## Coordination
- Issue: Closes #
- Agent: agent:codex / agent:claude / human
- Branch:
- Files owned:
- Open PR overlap checked: yes/no

## Research
- Required: yes/no
- Sources:
- Last checked:
- Simplification/game-balance notes:

## Verification
- [ ] npm test
- [ ] npm run lint
- [ ] npm run build
- [ ] Relevant smoke/browser test:
- Browser routes tested:

## Handoff
- Follow-up issues:
- Known risks:
- Cleanup done after merge:
```

## Handoff Template

Use this when pausing work or transferring to another agent:

```md
## Current State
- Branch/worktree:
- Last good commit:
- Dirty files:
- Tests last run:

## What Changed
- 

## What Remains
- 

## Risks
- 

## Next Agent Should
1.
2.
3.
```

## Enforcement Checklist For Repository Owner

Set these in GitHub settings or via API:

- Require PRs before merging to `main`.
- Require status checks: `build` and `smoke`.
- Require branches to be up to date before merging.
- Require conversation resolution.
- Disable force pushes and branch deletion.
- Prefer squash or rebase merge for linear history.
- Enable auto-delete head branches after merge.
- Require CODEOWNERS review once multiple human reviewers or trusted bot accounts exist.
- Keep issue labels for ownership and coordination. The canonical label list and `gh label create` commands live in [`.github/labels.md`](../.github/labels.md).

## Cleanup Routine

After a PR merges:

```powershell
git switch main
git fetch --prune origin
git pull --ff-only origin main
git branch --merged main
git worktree list
git worktree prune
```

Delete only branches that are fully merged or explicitly archived. If `git cherry main <branch>` shows unique commits, keep the branch until a human confirms deletion.
