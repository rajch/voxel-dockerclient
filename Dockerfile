ARG VERSION_STRING="0.4.2"

FROM node:23.11-alpine AS nodebuilder
RUN apk update && apk add git
WORKDIR /vdc
COPY client/ client/
COPY public/ public/
COPY package.json .
COPY package-lock.json .
RUN npm ci && npm run build-public && npm run build-client-release

FROM golang:1.25.1-alpine AS gobuilder
ARG VERSION_STRING
RUN apk update && apk add git
WORKDIR /vds
COPY server/ ./server
COPY go.* ./
RUN go mod tidy
RUN CGO_ENABLED='0' go build -o out/voxel-dockerserver -ldflags "-X 'main.version=${VERSION_STRING}'" server/*.go

FROM scratch AS final
WORKDIR /app
COPY --from=nodebuilder /vdc/out .
COPY --from=gobuilder /vds/out/voxel-dockerserver .
ENTRYPOINT ["/app/voxel-dockerserver"]
EXPOSE 8080
VOLUME [ "/app/data" ]
