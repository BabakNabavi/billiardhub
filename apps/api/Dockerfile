FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache nodejs npm

COPY package*.json ./
COPY turbo.json ./
COPY apps/api ./apps/api

# حذف ignoreDeprecations که با این TypeScript سازگار نیست
RUN sed -i '/"ignoreDeprecations"/d' /app/apps/api/tsconfig.json

WORKDIR /app/apps/api
RUN npm install
RUN npm run build

EXPOSE 4000
CMD ["node", "dist/main"]