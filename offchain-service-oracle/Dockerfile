# syntax=docker/dockerfile:1
ARG APP_DIRECTORY=/home/node/app

#
# ---- Base Node ---- HEAVIER, with build dependencies (git, build-essentials, python3, git...)
#
FROM node:22 AS build-base 
ARG APP_DIRECTORY

# install PNPM (https://github.com/pnpm/pnpm/issues/4495)
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

#
WORKDIR ${APP_DIRECTORY}
COPY ./package.json ./pnpm-lock.yaml ./

#
# ---- DEPS ----
#
FROM build-base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

#
# ---- BUILD ----
#
FROM build-base AS build
ARG APP_DIRECTORY

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .

# will build with sourcemaps, CAREFUL, do not more uppermore !
ENV NODE_ENV=production
RUN pnpm build

#
# ---- Output ----
#

FROM node:22-slim
ARG APP_DIRECTORY

# tell we are building code for production
ENV NODE_ENV=production
WORKDIR ${APP_DIRECTORY}

#
COPY --from=prod-deps ${APP_DIRECTORY}/node_modules ./node_modules
COPY --from=build ${APP_DIRECTORY}/dist ./dist

WORKDIR ${APP_DIRECTORY}/dist

#
ENTRYPOINT [ "node" ]
CMD [ "." ]
