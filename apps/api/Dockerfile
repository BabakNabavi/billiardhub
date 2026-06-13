FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN ls -la dist/
EXPOSE 4000
CMD ["sh", "-c", "node dist/main.js 2>&1 | tee /tmp/app.log || (cat /tmp/app.log && exit 1)"]