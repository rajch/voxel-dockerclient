FROM node:6.11-alpine AS nodebuilder
RUN apk update && apk add git
WORKDIR /root/vdc
COPY client/ client/
COPY public/ public/
COPY package.json package.json
RUN npm install && npm run build-public && npm run build-client-debug

FROM golang:1.8.3-alpine AS gobuilder
COPY server/server.go /go/src/github.com/rajch/voxel-dockerclient/server/
WORKDIR /go/src/github.com/rajch/voxel-dockerclient/server/
RUN CGO_ENABLED='0' go build

FROM scratch
COPY --from=gobuilder /go/src/github.com/rajch/voxel-dockerclient/server/server /server/server
COPY --from=nodebuilder /root/vdc/public/ public/
ENTRYPOINT ["/server/server"]
EXPOSE 80
