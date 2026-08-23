FROM node:22.12-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --include=optional

COPY . .

RUN npm run build

FROM caddy:2-alpine

COPY --from=builder /app/dist /usr/share/caddy

EXPOSE 80
