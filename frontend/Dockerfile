# ---------- Build Stage ----------
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy source code
COPY . .

# Build frontend (Vite + Tailwind)
RUN npm run build

# ---------- Development Stage (optional for dev) ----------
FROM node:20-alpine AS development
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# ---------- Production Stage ----------
FROM nginx:alpine AS production
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]