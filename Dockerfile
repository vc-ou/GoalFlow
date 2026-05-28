FROM node:20-bookworm-slim AS deps

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

FROM deps AS build

COPY tsconfig.base.json ./
COPY apps/server apps/server
COPY packages/shared packages/shared

RUN pnpm build:server

FROM node:20-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=80

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/apps/server/dist apps/server/dist
COPY --from=build /app/packages/shared packages/shared

EXPOSE 80

CMD ["pnpm", "start:server"]
