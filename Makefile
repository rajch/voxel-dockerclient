# Bump these on release, and for now manually update the deployment files:
#	docker-compose.yml, stack.yml and package.json
VERSION_MAJOR ?= 0
VERSION_MINOR ?= 4
BUILD_NUMBER  ?= 1
PATCH_STRING  ?= 

VERSION_STRING = $(VERSION_MAJOR).$(VERSION_MINOR).$(BUILD_NUMBER)$(PATCH_STRING)

IMAGE_TAG ?= $(VERSION_MAJOR).$(VERSION_MINOR).$(BUILD_NUMBER)
REGISTRY_USER ?= rajchaudhuri

.PHONY: all
all: client server

.PHONY: public
public:
	cp -r public/* out/

out/js/client.js: client/*.js
	npm run build-client-release

.PHONY: client
client: public out/js/client.js

.PHONY: client-debug
client-debug: public client/*.js
	npm run build-client-debug

out/voxel-dockerserver: server/*.go
	CGO_ENABLED='0' go build -o out/voxel-dockerserver -ldflags "-X 'main.version=$(VERSION_STRING)'" server/*.go

.PHONY: server
server: out/voxel-dockerserver

.PHONY: debug
debug: public client-debug server

.PHONY: build-docker
build-docker:
	docker image build -t $(REGISTRY_USER)/voxel-dockerclient:$(VERSION_STRING) -f Dockerfile .

.PHONY: run-docker
run-docker: build-docker
	docker container run --rm --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock --publish 8080:8080 $(REGISTRY_USER)/voxel-dockerclient:$(VERSION_STRING)

.PHONY: clean-docker
clean-docker:
	docker image rm $(REGISTRY_USER)/voxel-dockerclient:$(VERSION_STRING)

.PHONY: clean
clean:
	rm -rf out/*
