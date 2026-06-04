# CLAUDE.md — Startbook (startbook.github.io)

Hosts the Startbook marketing site (`startbook.co.uk`) / GitHub Pages presence. Related repos: `startbook-solito` (web/native app, `startbook.app`) and `startbook-backend` (Deno API on `:8080`).

> **Cross-repo:** one of three repos under `~/GitHub/startbook` (root index: `../CLAUDE.md`). This file is the durable knowledge base for this site; the **chronological** cross-repo maintenance history is in `../MAINTENANCE_LOG.md`.

## Site structure & conventions

- **Plain static HTML, no build step** — GitHub Pages serves the repo as-is. Domain `startbook.co.uk` via `CNAME`; `404.html` is the Pages fallback.
- **Dir-per-page.** Each page/section is a top-level directory with an `index.html` (`about/`, `partners/`, `platform/`, `team/`, `case-studies/`, `services/`, …). Shared static assets live in `assets/`, `css/`, `js/`. `events/` is the events index.
- **Client / event landing pages are top-level dirs** — e.g. `oxford-catalyst-grant/`, `cvc-skys-the-limit/`, `scaleup-bronx-business-pitch-challenge/`, `ucl-tech-for-good-competition/`, `london-youth/` (with year sub-paths like `london-youth/2026/`). To add one, create `<name>/index.html`.
- **Renaming a page changes its URL path** — update internal links (and any redirect/reference) when you do. Example: `cvc-oxford-seed-fund` → `oxford-catalyst-grant` (commit `828523c`).
- **Keep HTML htmlhint-clean** — htmlhint warnings were tidied in `ae6abfc`; don't reintroduce them when editing pages.

## Git Workflow

- **Solo project — commit straight to `main`. No feature branches, no PRs.** If other contributors join, revert to the branch + PR flow.
- Never commit without explicit user request.
- Clean commit messages with purpose-driven descriptions.
