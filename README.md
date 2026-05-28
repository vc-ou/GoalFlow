# GoalFlow

GoalFlow is a WeChat mini-program oriented product for turning AI-generated plans
into actionable milestones and next actions.

## Workspace

- `apps/mobile`: UniApp + Vue 3 client
- `apps/server`: Express + TypeScript + MongoDB API
- `packages/shared`: shared types and constants

## Quick start

```bash
pnpm install
pnpm dev:server
pnpm dev:mobile
```

## Environment

Copy `.env.example` to `.env` before running the server.

```bash
cp .env.example .env
```

Then update at least:

- `MONGODB_URI`
- `JWT_SECRET`

If you do not have a local MongoDB server, you can use the in-memory fallback for development:

```env
DEV_USE_INMEMORY_DB=true
```

## Current scaffold

- Express API with auth, plans, tasks, home, tomorrow-todos, and reviews route skeletons
- Mongoose models for all V1 entities
- Home aggregation service implementing current-plan, current-milestone, and next-action selection
- UniApp mobile shell with a styled home page wired to `GET /api/home`

## Next implementation steps

1. Replace the dev login stub with real WeChat login exchange
2. Add ownership checks to task and plan routes
3. Complete task editing, tomorrow-todo mutation, and review write APIs
4. Add Mongo seed data and automated tests

## Demo seed

After `.env` is configured and MongoDB is available, or after enabling the in-memory fallback:

```bash
pnpm --filter @goalflow/server seed
```

This creates a demo user with login code `demo` and a sample plan/task flow for the mobile home page.
