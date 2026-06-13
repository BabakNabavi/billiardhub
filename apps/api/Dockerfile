FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN ls -la /app/dist/
EXPOSE 4000
CMD ["node", "/app/dist/main.js"]