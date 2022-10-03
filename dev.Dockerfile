FROM node:16.17-alpine

WORKDIR /usr

COPY package.json ./
COPY tsconfig.json ./

COPY src ./src

RUN npm install

EXPOSE 4000

CMD ["npm", "run", "dev"]