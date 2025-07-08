# -------- Backend/Dockerfile --------
FROM node:20-alpine

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --production

# Copy source code
COPY . .

EXPOSE 3605
ENV NODE_ENV=production

CMD ["node", "server.js"]

