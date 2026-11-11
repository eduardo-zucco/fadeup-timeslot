FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 DB_FILE=/data/fadeup.sqlite
COPY package.json ./
COPY lib ./lib
COPY scripts/server.mjs ./scripts/server.mjs
COPY public ./public
COPY db ./db
EXPOSE 3000
CMD ["node", "scripts/server.mjs"]
