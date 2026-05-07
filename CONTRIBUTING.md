# Contributing

Thanks for taking the time to look. This is a solo project today and most work
flows through AI coding agents — see [`AGENTS.md`](./AGENTS.md) for the rules
those agents follow. Humans are welcome and follow the same workflow.

## Quick start

```bash
git clone https://github.com/jonathanwxh-cell/singapore-property-simulator.git
cd singapore-property-simulator
nvm use            # honors .nvmrc → Node 20
npm install
npm run dev        # http://localhost:5173
```

## Branching and PRs

- **Branch from `main`.** No direct commits to `main`; everything goes through
  a PR with a green CI run.
- **Branch naming:** `claude/<topic>`, `codex/<topic>`, or for humans
  `human/<topic>`. Use Conventional Commits for the commit subject (`feat:`,
  `fix:`, `refactor:`, `chore:`, `docs:`).
- **Small PRs.** Aim for under 500 LOC and under 24 hours from open to merge.

## Required checks before requesting review

```bash
npm run lint       # eslint clean
npm test           # vitest unit suite passes
npm run build      # tsc + vite build clean
```

If you touched gameplay, also run at least one of:

```bash
npm run test:smoke      # tutorial + first purchase
npm run test:profiles   # SC / PR / foreigner / single buyer rules
npm run test:scroll     # route-change scroll reset
```

## CHANGELOG

Add a bullet under `[Unreleased]` in [`CHANGELOG.md`](./CHANGELOG.md) when your
change is user-visible (new feature, balance change, UI change, save schema
change, Singapore-realism rule change). Refactors, internal docs, and
test-only changes do **not** need a CHANGELOG entry.

## Coordinating with other agents

If two agents are working in parallel, file ownership is described in
[`AGENTS.md`](./AGENTS.md). Hot zones (`package-lock.json`,
`src/data/saveSchema.ts`, `src/game/types.ts`, `src/engine/constants.ts`)
need extra coordination — read that section before opening a PR that
touches them.

## Releases

The maintainer cuts releases. The process is:

1. Move `[Unreleased]` entries in `CHANGELOG.md` under a new `[X.Y.Z] - YYYY-MM-DD`
   heading and open a fresh empty `[Unreleased]`.
2. Bump `version` in `package.json` (and `package-lock.json` self-references).
3. Tag the merge commit: `git tag -a vX.Y.Z -m "vX.Y.Z"` and push the tag.
4. Update the CHANGELOG compare links at the bottom of the file.

We follow [Semantic Versioning](https://semver.org). While the project is on
`0.x`, breaking gameplay or save-schema changes bump the minor (`0.5.0` →
`0.6.0`); fixes and small additive changes bump the patch.

## Reporting bugs and requesting features

Use the issue templates in [`.github/ISSUE_TEMPLATE`](./.github/ISSUE_TEMPLATE).
Security issues go through [`SECURITY.md`](./SECURITY.md), not the public
issue tracker.
