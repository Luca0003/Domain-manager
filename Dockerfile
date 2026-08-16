FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache openssl wget \
    && corepack enable \
    && corepack prepare pnpm@10.15.0 --activate

WORKDIR /workspace

# Copy only workspace manifests first so dependency installation stays cached
# when application source files change.
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY apps/worker/package.json ./apps/worker/package.json
COPY packages/configuration/package.json ./packages/configuration/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/testing/package.json ./packages/testing/package.json

FROM base AS deps
RUN pnpm install --no-frozen-lockfile

FROM deps AS source
COPY apps ./apps
COPY packages ./packages

FROM source AS generated
RUN DATABASE_URL="postgresql://domain_manager:domain_manager_local@postgres:5432/domain_manager?schema=public" \
    pnpm db:generate
RUN pnpm --filter @domain-manager/contracts build

FROM generated AS web-build
RUN pnpm --filter @domain-manager/web typecheck
RUN pnpm --filter @domain-manager/web build

FROM generated AS api-build
RUN pnpm --filter @domain-manager/api build

FROM generated AS worker-build
RUN pnpm --filter @domain-manager/worker build

FROM web-build AS web
ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "--filter", "@domain-manager/web", "start"]

FROM api-build AS api
ENV NODE_ENV=production
EXPOSE 3001
CMD ["pnpm", "--filter", "@domain-manager/api", "start"]

FROM worker-build AS worker
ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@domain-manager/worker", "start"]

FROM generated AS migrate
CMD ["pnpm", "--filter", "@domain-manager/database", "exec", "prisma", "migrate", "deploy"]
