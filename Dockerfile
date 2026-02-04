FROM node:20.19.4 AS builder
WORKDIR /app

COPY package-lock.json package.json ./
RUN npm ci --cache .npm

COPY . .
RUN npm run build

FROM node:20.19.4 AS deploy
WORKDIR /app

COPY --from=builder /app/ /app/

CMD [ "npm", "run", "start" ]