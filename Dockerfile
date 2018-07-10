FROM node:8-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 80
EXPOSE 1883

CMD node prepare.js && npm start
