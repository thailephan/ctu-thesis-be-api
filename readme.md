# Backend node
## Library
### Test
- chai
- supertest
### Image
- multer: Upload image
- sharp: resize, crop,... image
### Debug, logger
- winston
- debug
### Reduce size
- compression
### Work with date time
- date-fns
### Redis
- UI Manager: https://github.com/qishibo/AnotherRedisDesktopManager 
- https://redis.com
## Api service
- Default port: 4001
```shell
$ cd api-service
$ npm install
$ npm run dev
```
## Chat service
- Default port: 4002

[X] Typing

[X] User

## Asset service
- Default port: 8080
- TODO:
    - Image resize stackoverflow: https://stackoverflow.com/questions/22940724/go-resizing-images 
    - Image resize package: https://github.com/h2non/bimg
    - JPEG to PNG: https://gist.github.com/tizz98/fb15f8dd0c55ac8d2be0e3c4bd8249c3

## Reference links

## Mail service
- Send mail with nodemailer to google: https://dev.to/chandrapantachhetri/sending-emails-securely-using-node-js-nodemailer-smtp-gmail-and-oauth2-g3a

### Git
- Login once: https://www.freecodecamp.org/news/how-to-fix-git-always-asking-for-user-credentials/

### Ubuntu
- Change timezone: https://linuxize.com/post/how-to-set-or-change-timezone-on-ubuntu-20-04/

### Postgres
- Explicit convert null timestamp value to use `extract` function: https://stackoverflow.com/questions/36325173/convert-timestamp-column-values-to-epoch-in-postgresql-select-query
- LIKE without vietnamese accent: https://stackoverflow.com/questions/43293256/postgres-unaccent-for-character-with-more-than-1-diacritic
- LIKE without vietnamese accent:
  - https://stackoverflow.com/questions/43293256/postgres-unaccent-for-character-with-more-than-1-diacritic
  - https://www.postgresql.org/docs/9.1/unaccent.html

### Kafka
- UI Tool: https://kafkatool.com/download.html
- Offset explorer (kafka tool above): 
  - Read data in string format: https://stackoverflow.com/questions/48543167/kafka-tool-can-show-the-actual-string-instead-of-the-regular-hexadecimal-format
- Get started with Nodejs: https://developer.confluent.io/get-started/nodejs/
- Kafka quickstart: https://developer.confluent.io/quickstart/kafka-docker/

### Confluent Kakfa
- Configuration: https://docs.confluent.io/platform/current/installation/docker/config-reference.html#required-confluent-ak-settings

### IndexDB
- https://www.freecodecamp.org/news/a-quick-but-complete-guide-to-indexeddb-25f030425501/
- https://web.dev/indexeddb/
- https://www.npmjs.com/package/idb#wrap

### Express
- Extend Typescript object: https://stackoverflow.com/questions/37377731/extend-express-request-object-using-typescript