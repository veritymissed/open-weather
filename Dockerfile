FROM node:16

WORKDIR /home/node/app

COPY . .

RUN npm i yarn

RUN yarn
