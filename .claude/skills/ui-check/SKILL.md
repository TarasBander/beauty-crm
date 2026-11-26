---
name: ui-check
description: Visually verify frontend changes in this CRM by taking headless-Chrome screenshots of real pages in light and dark theme, at desktop and phone width (including the burger menu), then looking at them. Use after any change to styles, layout or a page's markup, before saying UI work is done.
---

# Visual check of the frontend

Tests and `tsc` don't show that a page looks right. After a UI change, take screenshots and look at them.

## 1. Make sure the app is running

```bash
nc -z localhost 5432 || npm run db:up           # from repo root
curl -s localhost:3000/health                    # backend: npm run dev:backend
curl -s -o /dev/null -w '%{http_code}' localhost:5173/   # frontend: npm run dev:frontend
```

Start any missing server in the background, not in the foreground.

## 2. Take screenshots

Save them in the session scratchpad, not in the repo:

```bash
node .claude/skills/ui-check/shots.mjs "$SCRATCH/shots" \
  login-light:/login:light:1440 \
  login-dark:/login:dark:1440 \
  dash-light:/:light:1440:full \
  dash-dark:/:dark:1440:full \
  phone-page:/clients:light:390 \
  phone-menu:/:dark:390:burger
```

Format: `name:path:theme:width[:action]`, where `action` is `full` (whole page) or `burger` (open the mobile menu). Always include the page you changed, in **both themes** and at **1440 and 390**. If you touched the layout, also take a `burger` shot.

Login comes from `SHOTS_EMAIL` / `SHOTS_PASSWORD`, defaulting to the seeded admin. If login fails, ask the user for credentials; never read `backend/.env`.

## 3. Look at every screenshot

Open each PNG with the Read tool and check:

- **Dark theme:** no white boxes, no dark text on dark background, no hard-coded colors leaking through.
- **Phone width:** no horizontal scroll, nothing cut off, the burger opens the menu, buttons don't overflow.
- **Wrapping:** labels, numbers and table headers don't break awkwardly.
- **States:** loading, empty and error states still show separately.

Fix what you find and take the screenshots again. In your report, list which screenshots you took, and say so if you skipped one.

Note: in `full` shots the fixed sidebar only reaches the first 900px. That's a capture artifact, not a bug. The palm-tree button in the corner is React Query Devtools, which appears only in dev.
