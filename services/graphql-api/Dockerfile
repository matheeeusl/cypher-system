# Build context is the repo root (needed for the workspace-wide install and
# build before the per-package deploy step) — build with:
#   docker build -t cypher-graphql-api -f services/graphql-api/Dockerfile .

FROM node:22-slim AS base
RUN corepack enable

FROM base AS build
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build
# --prod excludes devDependencies (vitest, @types/node, ...) from the
# deployed node_modules. injectWorkspacePackages: true in pnpm-workspace.yaml
# makes this a real, self-contained copy of @cypher/content and
# @cypher/engine (including @cypher/content's sibling content/ YAML
# directory, which its loader reads relative to its own compiled dist/ file)
# rather than a symlink back to this build stage's monorepo checkout, which
# wouldn't exist in the runtime stage below.
RUN pnpm --filter @cypher/graphql-api --prod deploy /prod/graphql-api

FROM node:22-slim AS runtime
WORKDIR /app
COPY --from=build /prod/graphql-api .
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000
CMD ["node", "dist/index.js"]
