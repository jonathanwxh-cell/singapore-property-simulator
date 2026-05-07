# docs/

Long-form working notes that don't belong inline in code or in the top-level
[`README.md`](../README.md). Each file here is dated and represents a
point-in-time artifact rather than living reference documentation.

If you are looking for:

- **What the game is and how to run it** → [`README.md`](../README.md)
- **Release history and Singapore-realism rule changes** → [`CHANGELOG.md`](../CHANGELOG.md)
- **How AI agents coordinate work on this repo** → [`AGENTS.md`](../AGENTS.md)
- **Branch protection and CI gates** → [`.github/branch-protection-recommended.md`](../.github/branch-protection-recommended.md)

## Layout

| Directory | Contents |
|---|---|
| [`playtests/`](./playtests) | Standalone playtest reports (e.g. the 2026-05-04 Singaporean-lens review). |
| [`superpowers/plans/`](./superpowers/plans) | Per-feature work plans authored before implementation. Filenames are `YYYY-MM-DD-<topic>.md`. |
| [`superpowers/specs/`](./superpowers/specs) | Design specs that supplement plans with mechanic and UI detail. |
| [`superpowers/playtests/`](./superpowers/playtests) | Playtest write-ups produced after a feature lands. |

## Conventions

- **Dated filenames.** Every artifact starts with the date it was authored
  (`YYYY-MM-DD-<slug>.md`). Files are not edited in place after their date —
  if a plan or spec needs revision, write a new dated follow-up that links
  back to the original.
- **Not the source of truth.** These notes describe what was intended or
  observed at a moment in time. The runnable code, tests, and `CHANGELOG.md`
  are authoritative when they disagree with anything in `docs/`.
- **No CHANGELOG entry needed.** Per [`AGENTS.md`](../AGENTS.md), internal
  docs (including everything under `docs/`) do not require a CHANGELOG entry.
