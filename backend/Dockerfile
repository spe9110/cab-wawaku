# backend/Dockerfile
# ---------- Base ----------
FROM node:22.15.0-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./

# ---------- Development ----------
FROM base AS development
ENV NODE_ENV=development
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]

# ---------- Production ----------
FROM base AS production
ENV NODE_ENV=production
RUN npm ci --omit=dev
COPY . .
EXPOSE 4000
CMD ["npm", "run", "start"]