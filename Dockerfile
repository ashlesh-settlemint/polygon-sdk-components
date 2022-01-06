FROM golang:alpine AS builder

RUN apk update && apk add --no-cache git gcc g++ linux-headers curl

WORKDIR /go/bin
COPY . /go/bin

RUN go build -ldflags="-w -s" -o /go/bin/polygon

FROM golang:alpine

COPY --from=builder /go/bin/polygon /go/bin/polygon

ENTRYPOINT ["/go/bin/polygon"]