# This Dockerfile must be used from the parent directory context, see README
FROM node:15.6-alpine3.12 as ci

ARG NPM_TOKEN
WORKDIR /app
COPY . .
RUN echo "//npm.pkg.github.com/:_authToken=$NPM_TOKEN" > .npmrc && \
  echo "@gads-citron:registry=https://npm.pkg.github.com" >> .npmrc && \
  yarn install --frozen-lockfile && \
  yarn check:all && yarn build && yarn test && \
  rm -f .npmrc

FROM node:15.6-alpine3.12 as runtime-builder

ARG NPM_TOKEN
WORKDIR /app

COPY --from=ci /app/package.json /app/yarn.lock ./
COPY --from=ci /app/dist ./dist

RUN echo "//npm.pkg.github.com/:_authToken=$NPM_TOKEN" > .npmrc && \
  echo "@gads-citron:registry=https://npm.pkg.github.com" >> .npmrc && \
  yarn install --production && \
  rm -f .npmrc

FROM node:15.6-alpine3.12 as runtime-container

WORKDIR /app

COPY --from=runtime-builder /app/node_modules ./node_modules
COPY --from=runtime-builder /app/dist ./dist

# Use the same port as the one defined by `monitoring.port` in your configuration
EXPOSE 8086

ENTRYPOINT [ "node", "dist/index.js" ]
