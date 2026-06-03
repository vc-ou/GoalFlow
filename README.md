# GoalFlow

GoalFlow is a WeChat mini-program oriented product for turning AI-assisted plans into executable milestones, tasks, reviews, and daily next actions.

## Start Here

If you are taking over the project, read these first:

1. [Project Structure](/Users/vc/Documents/GoalFlow/docs/project-structure.md)
2. [PRD](/Users/vc/Documents/GoalFlow/PRD.md)
3. [Development Spec](/Users/vc/Documents/GoalFlow/DEVELOPMENT_SPEC.md)
4. [CVM Deployment Guide](/Users/vc/Documents/GoalFlow/docs/deploy-cvm.md)

## Repository Layout

- `apps/mobile`
  UniApp + Vue 3 user client for H5 and WeChat mini-program builds.
- `apps/server`
  Express + TypeScript + MongoDB API.
- `apps/admin`
  Lightweight admin console.
- `packages/shared`
  Shared TypeScript package used by the apps.
- `docs`
  Handoff and deployment documentation.

## Core Product Model

The product is built around:

`Plan -> Milestone -> Task`

Supporting modules:

- `reviews`
- `tomorrow_todos`
- `current_plan`
- `current_milestone`
- `next_action`

## Quick Start

```bash
pnpm install
cp .env.example .env
```

Update at least:

- `MONGODB_URI`
- `JWT_SECRET`

If you do not want to run a local Mongo instance, enable the in-memory fallback:

```env
DEV_USE_INMEMORY_DB=true
```

Then start the main services:

```bash
pnpm dev:server
pnpm dev:mobile
```

Optional admin console:

```bash
pnpm dev:admin
```

## Useful Commands

Root:

```bash
pnpm dev:server
pnpm dev:mobile
pnpm dev:admin
pnpm build:shared
pnpm build:server
pnpm build:mobile
pnpm build:admin
pnpm typecheck
```

Targeted:

```bash
pnpm --filter @goalflow/mobile test
pnpm --filter @goalflow/server test
pnpm --filter @goalflow/mobile typecheck
pnpm --filter @goalflow/server typecheck
```

## Main Entry Points

### Mobile

- [home/index.vue](/Users/vc/Documents/GoalFlow/apps/mobile/src/pages/home/index.vue)
- [plans/detail.vue](/Users/vc/Documents/GoalFlow/apps/mobile/src/pages/plans/detail.vue)
- [tasks/detail.vue](/Users/vc/Documents/GoalFlow/apps/mobile/src/pages/tasks/detail.vue)
- [profile/index.vue](/Users/vc/Documents/GoalFlow/apps/mobile/src/pages/profile/index.vue)

### Server

- [app.ts](/Users/vc/Documents/GoalFlow/apps/server/src/app.ts)
- [index.ts](/Users/vc/Documents/GoalFlow/apps/server/src/index.ts)
- [home-service.ts](/Users/vc/Documents/GoalFlow/apps/server/src/services/home-service.ts)
- [tasks.ts](/Users/vc/Documents/GoalFlow/apps/server/src/routes/tasks.ts)
- [auth.ts](/Users/vc/Documents/GoalFlow/apps/server/src/routes/auth.ts)

## Demo Seed

You can seed a demo user and sample data with:

```bash
pnpm --filter @goalflow/server seed
```

This creates a demo account flow for local mobile development.

## WeChat Mini Program Build

Build:

```bash
pnpm --filter @goalflow/mobile build:mp-weixin
```

Output:

- `apps/mobile/dist/mp-weixin`

Upload and release details are documented in [deploy-cvm.md](/Users/vc/Documents/GoalFlow/docs/deploy-cvm.md).

## Notes For Maintainers

- The mobile app is the primary product surface.
- The densest product logic currently lives in the plan detail page, task detail page, and home aggregation service.
- The server supports a dev fallback for login/in-memory data, so be careful not to assume production WeChat auth behavior while testing locally.
- The project structure document is the best “fast handoff” reference for new contributors.
