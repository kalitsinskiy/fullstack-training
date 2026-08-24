# ---------- Stage 1: Build ----------
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_WS_URL
ENV VITE_WS_URL=$VITE_WS_URL

RUN npm run build

# ---------- Stage 2: Serve ----------
# Unprivileged nginx: runs as the non-root uid 101 and binds port 8080 (a
# privileged port <1024 like 80 can't be bound by a non-root process).
FROM nginxinc/nginx-unprivileged:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
