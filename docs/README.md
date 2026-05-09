# docs/

Long-form working notes that do not belong inline in code or in the top-level
[`README.md`](../README.md). Most files here are dated point-in-time artifacts;
the agent collaboration template is a living reference because it governs how
future work is coordinated.

If you are looking for:

- **What the game is and how to run it** -> [`README.md`](../README.md)
- **Release history and Singapore-realism rule changes** -> [`CHANGELOG.md`](../CHANGELOG.md)
- **How AI agents coordinate work on this repo** -> [`AGENTS.md`](../AGENTS.md)
- **Reusable parallel-agent playbook** -> [`agent-collaboration-template.md`](./agent-collaboration-template.md)
- **Branch protection and CI gates** -> [`.github/branch-protection-recommended.md`](../.github/branch-protection-recommended.md)

## Layout

| Directory / file | Contents |
|---|---|
| [`agent-collaboration-template.md`](./agent-collaboration-template.md) | Living template for coordinating Codex, Claude, humans, and future agents in parallel. |
| [`playtests/`](./playtests) | Standalone playtest reports (e.g. the 2026-05-04 Singaporean-lens review). |
| [`superpowers/plans/`](./superpowers/plans) | Per-feature work plans authored before implementation. Filenames are `YYYY-MM-DD-<topic>.md`. |
| [`superpowers/specs/`](./superpowers/specs) | Design specs that supplement plans with mechanic and UI detail. |
| [`superpowers/playtests/`](./superpowers/playtests) | Playtest write-ups produced after a feature lands. |

## Conventions

- **Dated filenames.** Most artifacts start with the date they were authored (`YYYY-MM-DD-<slug>.md`). If a plan or spec needs revision, prefer a new dated follow-up that links back to the original.
- **Living references.** `agent-collaboration-template.md`, `AGENTS.md`, and GitHub workflow docs can be updated in place because they govern active process.
- **Not the source of truth.** Dated notes describe what was intended or observed at a moment in time. Runnable code, tests, and `CHANGELOG.md` are authoritative when they disagree.
- **No CHANGELOG entry needed.** Per [`AGENTS.md`](../AGENTS.md), internal docs under `docs/` do not require a CHANGELOG entry unless the repo process itself changes in a user-visible way.
