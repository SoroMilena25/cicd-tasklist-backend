# ---------- Stage 1: install dependencies & build ----------
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies (including devDependencies, needed for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source, prisma schema, tsconfig
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src

# Generate Prisma Client (against schema.prisma, mysql provider)
RUN npx prisma generate --schema=prisma/schema.prisma

# Compile TypeScript -> dist/
RUN npm run build

# ---------- Stage 2: production image ----------
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy generated Prisma client + schema (needed at runtime)
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

# Copy compiled JS output
COPY --from=build /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/server.js"]