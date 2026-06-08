FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

RUN npm ci --workspace=apps/api

COPY apps/api/ ./apps/api/

WORKDIR /app/apps/api
RUN npm run build

EXPOSE 4000
CMD ["node", "dist/main"]