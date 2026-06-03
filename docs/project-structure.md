# GoalFlow Project Structure

This document is the fastest way for a new maintainer to build a mental map of the repository.

## What This Project Is

GoalFlow is a WeChat mini-program oriented product for turning plans into:

- plans
- milestones
- tasks
- reviews
- tomorrow todos

The repository is a PNPM monorepo with three apps and one shared package.

## Top-Level Layout

- `apps/mobile`
  UniApp + Vue 3 client for the end user. This is the main product surface.
- `apps/server`
  Express + TypeScript API. Owns auth, plan/task data, aggregation logic, and admin APIs.
- `apps/admin`
  Vite + Vue admin console for operators.
- `packages/shared`
  Shared TypeScript types/constants used across apps.
- `docs`
  Project docs. Deployment and handoff docs live here.
- `deploy`
  Infra examples, currently focused on Nginx/CVM deployment.
- `PRD.md`
  Product requirement source document.
- `DEVELOPMENT_SPEC.md`
  Detailed behavior, data model, and API expectations.
- `CLAUDE.md`
  Repository-specific guidance for coding agents and contributors.

## App Map

### `apps/mobile`

Main folders:

- `src/pages`
  User-facing pages.
- `src/api`
  Thin request wrappers around backend APIs.
- `src/stores`
  Shared client state, currently centered on home data.
- `src/utils`
  Small UI/business helpers.
- `src/static`
  Tabbar icons and product assets.
- `src/test`
  Vitest page-level tests.

Important pages:

- `pages/home/index.vue`
  Main daily dashboard. Shows current plan, current milestone, next action, recommended tasks, tomorrow todos, and recent completions.
- `pages/plans/index.vue`
  Plan list and plan creation entry.
- `pages/plans/detail.vue`
  Plan detail page. Handles milestone roadmap, milestone management, task creation, and task quick actions.
- `pages/tasks/detail.vue`
  Task detail page. Now defaults to preview mode and switches into edit mode only after tapping `编辑任务`.
- `pages/reviews/index.vue`
  Review list/editor page.
- `pages/profile/index.vue`
  Profile and WeChat login/profile editing page.

Routing/config:

- `src/pages.json`
  UniApp page registry and tabbar configuration.
- `src/manifest.json`
  Mini-program app metadata, including WeChat `appid`.

### `apps/server`

Main folders:

- `src/routes`
  HTTP route handlers.
- `src/models`
  Mongoose models.
- `src/services`
  Cross-route business logic and aggregation.
- `src/middleware`
  Auth and admin auth guards.
- `src/scripts`
  Seed scripts.
- `src/test`
  Vitest + Supertest API tests.
- `src/config`
  Env loading and database bootstrapping.

Important backend pieces:

- `src/app.ts`
  Express app composition. This is the route map.
- `src/index.ts`
  Server bootstrap. Connects DB and starts HTTP server.
- `src/config/db.ts`
  Supports both normal MongoDB and in-memory Mongo fallback for development/tests.
- `src/routes/auth.ts`
  WeChat login entry.
- `src/routes/home.ts`
  Home aggregation API consumed by the mobile dashboard.
- `src/services/home-service.ts`
  Core “current plan / current milestone / next action” selection logic.
- `src/routes/tasks.ts`
  Task CRUD and status updates.
- `src/routes/profile.ts`
  Profile read/update.
- `src/routes/admin.ts`
  Admin-only APIs used by `apps/admin`.

### `apps/admin`

This is intentionally small.

- `src/App.vue`
  Entire admin UI shell in one page.
- `src/api.ts`
  Admin API wrappers.

Admin covers:

- admin login
- user search/status control
- template creation/edit/copy
- dashboard stats

### `packages/shared`

- `src/index.ts`
  Shared types/constants for cross-app consistency.

The server depends on its compiled `dist` output during production builds, so do not remove the package even though it is small.

## Product/Data Concepts

The core model is:

`Plan -> Milestone -> Task -> Review/Execution`

Supporting concepts:

- `tomorrow_todos`
  Lightweight next-day scratchpad, separate from the main task graph.
- `current_plan`
  User-selected active plan.
- `current_milestone`
  Derived milestone: first milestone that still has unfinished tasks.
- `next_action`
  Derived task shown on the home page.

## Current Runtime Flows

### Local development

Root scripts:

- `pnpm dev:server`
- `pnpm dev:mobile`
- `pnpm dev:admin`

Helpful fallback:

- set `DEV_USE_INMEMORY_DB=true` in local env to boot the server without a local Mongo instance.

### Mobile H5

- served from `apps/mobile`
- API base comes from `VITE_API_BASE_URL`
- default request client is `apps/mobile/src/api/http.ts`

### WeChat mini-program build

- build command: `pnpm --filter @goalflow/mobile build:mp-weixin`
- output: `apps/mobile/dist/mp-weixin`
- upload is done with WeChat DevTools CLI, described in [deploy-cvm.md](/Users/vc/Documents/GoalFlow/docs/deploy-cvm.md:130)

## Files Worth Reading First

If you are new to the project, read in this order:

1. `README.md`
2. `docs/project-structure.md`
3. `PRD.md`
4. `DEVELOPMENT_SPEC.md`
5. `apps/server/src/app.ts`
6. `apps/mobile/src/pages/home/index.vue`
7. `apps/mobile/src/pages/plans/detail.vue`
8. `apps/mobile/src/pages/tasks/detail.vue`

## Testing Map

- mobile page tests: `apps/mobile/src/test`
- server API tests: `apps/server/src/test`
- workspace-wide typecheck: `pnpm -r typecheck`

Common targeted commands:

- `pnpm --filter @goalflow/mobile test`
- `pnpm --filter @goalflow/server test`
- `pnpm --filter @goalflow/mobile typecheck`
- `pnpm --filter @goalflow/server typecheck`

## Cleanup Decisions Already Made

The repository no longer keeps these local-only artifacts:

- `.codex-artifacts/`
  Manual test screenshots.
- `.venv-avatar/`
  Local Python virtual environment.
- stray `.DS_Store` files

They are ignored in `.gitignore` now.

The old `design/ui-mockups/` tree has been removed as obsolete design archive material. It was not referenced by runtime code or active documentation, so it is no longer treated as part of the maintained project surface.

## Practical Guardrails For The Next Maintainer

- Do not assume H5 and WeChat login behave the same. The project has a demo/dev fallback path around WeChat auth.
- Plan detail and task detail are the densest mobile pages. Most UX changes end up touching tests there.
- The server is small enough that route + model + service can be understood together. Prefer reading full flows instead of isolated files.
- `DEVELOPMENT_SPEC.md` is more operationally useful than the README when behavior is ambiguous.
