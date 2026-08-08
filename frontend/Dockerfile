FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM nginx:1.25.4-alpine-slim AS prod
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY env.sh /docker-entrypoint.d/env.sh
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
