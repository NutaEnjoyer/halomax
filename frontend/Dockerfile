FROM node:18-alpine

WORKDIR /app

# Set environment variable to prevent issues
ENV WATCHPACK_POLLING=true

COPY package*.json ./

# Configure npm for better reliability and install dependencies
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm cache clean --force && \
    npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
