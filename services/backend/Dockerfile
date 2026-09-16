FROM node:22-slim AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json package-lock.json medusa-config.ts tsconfig.json ./
COPY src ./src

RUN npm run build

EXPOSE 9000

CMD ["npx", "medusa", "start"]
