# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
COPY client/ client/

RUN corepack enable && \
  yarn install

WORKDIR /app/client
RUN yarn build

# Production stage
FROM nginx:alpine

COPY nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/client/dist /usr/share/nginx/html/dist
COPY --from=builder /app/client/dist /usr/share/nginx/html/dist-blue
COPY --from=builder /app/client/dist /usr/share/nginx/html/dist-green

RUN sed -i "s|root /usr/share/nginx/html.*;|root /usr/share/nginx/html/dist-blue;|g" /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]