FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

ARG VITE_API_BASE=http://localhost:8000
ARG VITE_APP_CLIENT_ID
ARG VITE_APP_CLIENT_SECRET
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_APP_CLIENT_ID=$VITE_APP_CLIENT_ID
ENV VITE_APP_CLIENT_SECRET=$VITE_APP_CLIENT_SECRET
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
