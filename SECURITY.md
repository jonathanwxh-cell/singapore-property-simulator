# Security policy

## Supported versions

Only the latest released version receives security fixes. Older versions are
not patched.

| Version | Supported |
|---|---|
| 0.5.x | ✅ |
| 0.4.x | ❌ |
| < 0.4 | ❌ |

## Reporting a vulnerability

**Do not open a public GitHub issue for security problems.**

Please use GitHub's private vulnerability reporting:

> Repo → **Security** tab → **Report a vulnerability**

Or email the maintainer listed in [`package.json`](./package.json) at the
address on their GitHub profile, with `[security]` in the subject line.

In your report, include:

- A description of the issue and its impact (e.g. save-file tampering,
  client-side state corruption, dependency CVE).
- Steps to reproduce, including a minimal save file or seed if relevant.
- The commit SHA or tag you tested against.

You should expect an acknowledgement within 7 days. Because this is a
single-player browser game with no server-side component, the realistic
threat surface is:

- Tampered save files that crash or exploit the importer.
- Malicious dependency upgrades surfacing through the Vite/React/Playwright
  toolchain.
- XSS or data-injection issues in user-controllable strings (player name,
  profile transfer code).

Out of scope:

- Findings that require the player to deliberately edit their own save and
  cheat themselves — this is a single-player simulator, not a server.
- Issues in third-party services (GitHub, npm, browser vendors).
