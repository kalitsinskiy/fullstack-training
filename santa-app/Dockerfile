# --- Build stage ---
FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_NOTIFICATIONS_URL
ENV VITE_NOTIFICATIONS_URL=$VITE_NOTIFICATIONS_URL

ARG VITE_WS_URL
ENV VITE_WS_URL=$VITE_WS_URL

RUN npx vite build

# --- Serve stage ---
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
