FROM oven/bun:latest

WORKDIR /app

COPY package*.json ./
COPY bun.lockb ./
COPY src ./src
COPY Inventories ./Inventories