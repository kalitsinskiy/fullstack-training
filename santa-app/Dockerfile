# Multi-stage build for the React client:
#   1) build the static bundle with Node + Vite
#   2) serve it with nginx (a tiny final image, no Node runtime shipped)

# --- Build stage ---
FROM node:22-alpine AS build
WORKDIR /app

# Vite inlines VITE_* variables at BUILD time, so the API URL must be known
# here — not at container start. Pass it in with --build-arg VITE_API_URL=...
# (default empty → the app uses same-origin relative URLs).
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_NOTIFICATIONS_URL=
ENV VITE_NOTIFICATIONS_URL=$VITE_NOTIFICATIONS_URL

# Install deps first (layer caching): this layer only rebuilds when the
# manifests change, not on every source edit.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the source and build. `npm run build` runs `tsc --noEmit && vite build`,
# emitting static files to /app/dist.
COPY . .
RUN npm run build

# --- Serve stage ---
FROM nginx:alpine

# SPA fallback config (client-side routing).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static build output from the build stage — no Node, no node_modules.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
