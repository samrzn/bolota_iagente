FROM node:22-alpine AS deps

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

###############################################

FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

###############################################

FROM node:22-alpine AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /usr/src/app ./

###############################################

RUN addgroup --system nodeapp && adduser --system --ingroup nodeapp nodeapp
USER nodeapp

EXPOSE 3000

CMD ["node", "src/server.js"]
