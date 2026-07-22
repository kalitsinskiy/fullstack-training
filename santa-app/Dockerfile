# ---------- Stage 1: Build ----------
FROM node:22-alpine AS build

WORKDIR /app

# Pass VITE_API_URL as build argument so Vite bakes it into static assets
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Stage 2: Production ----------
FROM nginx:alpine

# Copy built static files to Nginx default public directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx SPA configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
