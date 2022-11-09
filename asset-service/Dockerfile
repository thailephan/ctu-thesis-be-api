## Multistage Docker file to minimize image size
##
## STEP 1 - BUILD
##

# specify the base image to  be used for the application, alpine or ubuntu
FROM golang:1.19.0-alpine3.16 AS builder

# create a working directory inside the image
WORKDIR /app

# copy Go modules and dependencies to image
COPY go.mod go.sum ./

# download Go modules and dependencies
RUN go mod tidy

# copy directory files i.e all files ending with .go
COPY . .

# compile application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .


##
## STEP 2 - DEPLOY
##
FROM alpine:3.16

WORKDIR /app

COPY --from=builder /app/main .

# Create a group and user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

CMD ["/app/main"]