FROM node:20-alpine
WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy only api workspace
COPY apps/api ./apps/api

# Install dependencies for api only
WORKDIR /app/apps/api
RUN npm install

# Build
RUN npm run build

EXPOSE 4000
CMD ["node", "dist/main"]