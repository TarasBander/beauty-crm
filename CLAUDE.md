# Beauty CRM

Pet-project CRM for the beauty industry (selling equipment and cosmetics to salons).
npm-workspaces monorepo: `backend/` (NestJS 12 + TypeORM + Postgres 16), `frontend/` (React 19 + Vite + TanStack Query).

## Commands

Run from the repo root unless noted.

- `npm run db:up` / `npm run db:down`: Postgres in Docker (`crm-postgres`, port 5432)
- `npm run dev:backend` (http://localhost:3000), `npm run dev:frontend` (http://localhost:5173, proxies `/api` to the backend)
- Backend (`cd backend`): `npm run lint`, `npx tsc --noEmit -p tsconfig.json`, `npm test`, `npm run test:e2e` (needs the DB up), `npm run seed:admin`, `npm run seed:demo`, `npm run seed:history` (sales history 2020→today for the dashboard chart; run after seed:demo)
- Frontend (`cd frontend`): `npm run lint`, `npm test`, `npm run build` (also typechecks)

Before saying backend work is done: lint + tsc + `npm test` + `npm run test:e2e`.

## Backend conventions

- ESM: relative imports end in `.js` (`'./users.service.js'`), even from `.ts` files.
- Errors are thrown as `{ messageKey }` and translated by `I18nExceptionFilter`. Never put user-facing text in a service. Add every new key to both `uk` and `en` in `src/i18n/messages.ts`.
- Auth: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`. The UI hiding a page is not access control; the API must enforce the same rule. `/users` and `/api-keys` are admin-only.
- `JwtStrategy.validate()` reloads the user from the DB every request (inactive → 401, role comes from DB, not the token). Don't "optimize" that away.
- Every module that uses `JwtAuthGuard` must import `PassportModule.register({ defaultStrategy: 'jwt' })` (see the comment in `users.module.ts`).
- `:id` route params get `ParseUUIDPipe`, otherwise bad ids turn into 500s.
- Lists are paginated via `paginate()` in `src/common/pagination.util.ts`. Never return a whole table.
- Aggregates (dashboard, totals) are SQL `COUNT` / `SUM` / `GROUP BY` through the query builder, not `find()` + JS filtering. `numeric` and `COUNT` come back from `pg` as strings; convert to numbers.
- `JWT_SECRET` is read only via `getJwtSecret()` (`src/auth/jwt-secret.ts`), which refuses the dev default in production.
- Never log passwords, tokens or `error.message` from public endpoints.
- `synchronize: true` is on (no migrations yet); entity changes alter the dev DB directly.

## Frontend conventions

- Feature folders under `src/features/<name>/`: `api.ts` (request functions + query-key factory), `hooks.ts` (TanStack Query), page + `components/`.
- All UI text through i18next, with keys in both `src/i18n/locales/uk.json` and `en.json`, including `aria-label`s.
- Admin-only routes go through `AdminRoute` and `roles` in `Layout.tsx`, and must match the backend `@Roles`.
- Keep loading / empty / error states separate (`QueryStatus`).
- Styling follows the **design-system** skill: teal + peach tokens in `src/index.css`, no hex colors in `App.css` or components, and both light and dark theme must work. After UI changes, run the **ui-check** skill (screenshots in both themes, at 1440 and 390 width).

## Tests

- Backend e2e (`backend/test/app.e2e-spec.ts`) runs against the real dev DB, creates its own throwaway users and deletes them in `afterAll`. New auth or role rules get an e2e case there.
- The login rate limit is 10 requests per IP per 15 minutes, in memory. Many logins in one e2e run will hit it.

## Claude hooks (`.claude/settings.json`)

- Writes to real `.env` files are blocked, whether through Edit/Write or Bash (`>`, `tee`, `sed -i`, `cp`, …).
- `git commit` / `git push` first run lint + unit tests for each touched workspace (`.claude/hooks/git-checks.sh`), and are blocked if they fail or a `.env` would be included.
- `git push` also runs a senior-FE review agent over the frontend diff (re-renders, a11y, XSS). It blocks only real problems; fix what it reports instead of working around it.

## Priorities

Hardening comes before features. Do not add a new CRM module while open items remain: `ParseUUIDPipe` on all `:id` params, a Playwright smoke test, real pagination for the 100-card kanban, and server-side search everywhere.

Comments and seed output are often in Ukrainian; match the language of the surrounding file.
