---
name: api-endpoint
description: Checklist for adding or changing a backend REST endpoint in this CRM (NestJS controller/service/DTO), including guards, roles, validation, i18n errors, frontend wiring and e2e test. Use whenever a task touches a backend controller or adds a route.
---

# Adding or changing an API endpoint

Work through this in order. Skip a step only if it truly does not apply, and say so.

## 1. Access control

- Controller (or handler) has `@UseGuards(JwtAuthGuard, RolesGuard)`.
- `@Roles(...)` matches who sees the feature in the UI (`frontend/src/shared/components/Layout.tsx` `roles`, `AdminRoute`). If the UI is admin-only, the API is admin-only.
- The module imports `PassportModule.register({ defaultStrategy: 'jwt' })`.
- Public endpoints (no guard) are rare: only `/`, `/health` and `/auth/login`. A new public route needs a reason.

## 2. Input

- Body and query use a DTO class with `class-validator` decorators. Trim strings with `@Transform` like `create-user.dto.ts`.
- Every `:id` param: `@Param('id', ParseUUIDPipe) id: string`.
- List endpoints take `PaginationQueryDto` (or extend it) and return `paginate(...)`. Never return an unbounded `find()`.

## 3. Errors and output

- Throw `new NotFoundException({ messageKey: '<module>.notFound' })` and similar; add the key to both `uk` and `en` in `backend/src/i18n/messages.ts`.
- Return through a mapper (`toPublicX`), never a raw entity that might carry `passwordHash` or secrets.
- Totals and stats use SQL aggregates (`COUNT`/`SUM`/`GROUP BY`), not JS over full tables.

## 4. Frontend (if the UI uses it)

- Request function plus query key in `features/<name>/api.ts`, hook in `hooks.ts`, and invalidate the right keys on mutation.
- New UI strings go in both `uk.json` and `en.json`.

## 5. Tests

- Add a case to `backend/test/app.e2e-spec.ts` for every access rule: no token → 401, wrong role → 403, plus the happy path. Clean up any rows you create.

## 6. Verify

```bash
cd backend && npm run lint && npx tsc --noEmit -p tsconfig.json && npm test
npm run db:up   # from repo root, if Postgres isn't running
cd backend && npm run test:e2e
```

If the frontend changed: `cd frontend && npm run lint && npm test && npm run build`.

Report the actual results. If e2e couldn't run (for example, no Docker), say so instead of claiming it passed.
