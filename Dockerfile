FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 DB_FILE=/data/fadeup.sqlite
COPY package.json ./
COPY aplicacao ./aplicacao
COPY ferramentas/servidor.mjs ./ferramentas/servidor.mjs
COPY banco ./banco
EXPOSE 3000
CMD ["node", "ferramentas/servidor.mjs"]
