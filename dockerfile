FROM oven/bun:latest

RUN mkdir -p /home/bun/app/node_modules && chown -R bun:bun /home/bun/app

WORKDIR /home/bun/app

COPY package.json ./
COPY bun.lockb ./

USER bun

RUN bun install

COPY --chown=bun:bun . .

CMD ["bun", "run", "start"]