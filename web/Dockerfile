FROM node:lts-alpine as build-stage
WORKDIR /app

COPY ["package.json", "yarn.lock", "./"]
RUN yarn && \
    yarn cache clean

COPY . .

EXPOSE 3000
CMD ["yarn", "dev", "--host"]