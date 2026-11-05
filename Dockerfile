# --- Build ---
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Variables de Vite (se inyectan en tiempo de build)
ARG VITE_API_BASE
ARG VITE_API_URL
ARG VITE_BIDDING_START
ARG VITE_BIDDING_END
ARG VITE_REVIEW_START
ARG VITE_REVIEW_END
ENV VITE_API_BASE=$VITE_API_BASE \
    VITE_API_URL=$VITE_API_URL \
    VITE_BIDDING_START=$VITE_BIDDING_START \
    VITE_BIDDING_END=$VITE_BIDDING_END \
    VITE_REVIEW_START=$VITE_REVIEW_START \
    VITE_REVIEW_END=$VITE_REVIEW_END

RUN npm run build

# --- Serve ---
FROM nginx:1.27-alpine

# La imagen de nginx procesa los templates con envsubst al iniciar
ENV PORT=8080
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
