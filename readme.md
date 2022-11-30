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

### Git
- Login once: https://www.freecodecamp.org/news/how-to-fix-git-always-asking-for-user-credentials/

### Ubuntu
- Change timezone: https://linuxize.com/post/how-to-set-or-change-timezone-on-ubuntu-20-04/

### Postgres
- Explicit convert null timestamp value to use `extract` function: https://stackoverflow.com/questions/36325173/convert-timestamp-column-values-to-epoch-in-postgresql-select-query