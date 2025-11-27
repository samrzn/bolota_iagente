FROM node:22-slim AS deps

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y \
    g++ \
    make \
    python3 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci --omit=dev

###############################################

FROM node:22-slim AS builder

WORKDIR /usr/src/app

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

###############################################

FROM node:22-slim AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /usr/src/app ./

###############################################

RUN addgroup --system nodeapp && adduser --system --ingroup nodeapp nodeapp
USER nodeapp

EXPOSE 3000

CMD ["node", "src/server.js"]
