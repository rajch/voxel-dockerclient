# voxel-dockerclient
An experimental Minecraft-like docker client, built using [voxel.js](http://voxeljs.com/). Inspired by [dockercraft](https://github.com/docker/dockercraft).

[![Docker Pulls](https://img.shields.io/docker/pulls/rajchaudhuri/voxel-dockerclient "Number of times the voxel-dockerclient image was pulled from the Docker Hub")](https://hub.docker.com/r/rajchaudhuri/voxel-dockerclient)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/rajch/voxel-dockerclient?include_prereleases)](https://github.com/rajch/voxel-dockerclient/releases)

> [!IMPORTANT]
> This software is dependent, indirectly, on a version of [three.js](https://threejs.org/) that has known vulnerabilities. For a number of reasons, this dependency **cannot** currently be updated. So, this software is now in maintenance mode.
>
> The reasons are given [below](#how-does-it-work).
> Use the software at your own risk.

## What is it?
The dockercraft project turns the official Minecraft client into a docker client. voxel-dockerclient is a pure-javascript, browser-only docker client that provides a similar experiance.

## What is it not?
voxel-dockerclient is not a serious tool for working with docker. It's a fun project (which may grow up to be a teaching aid someday).

> [!WARNING]
> Please use voxel-dockerclient with care.
> It requires access to the docker socket. 

## How to run voxel-dockerclient
### Try it on Play With Docker
The easiest way:

[![Try in PWD](https://raw.githubusercontent.com/play-with-docker/stacks/master/assets/images/button.png)](https://labs.play-with-docker.com/?stack=https://raw.githubusercontent.com/rajch/voxel-dockerclient/master/stack.yml)

### Use the published docker image
The next easiest way is to pull the docker image, and run from that. The steps are as follows:

1. Pull the docker image with

  ```
  docker pull rajchaudhuri/voxel-dockerclient
  ```
  
2. Run it with:

  ```
  docker run -d -p 8080:8080 -v /var/run/docker.sock:/var/run/docker.sock rajchaudhuri/voxel-dockerclient
  ```

  > The  `-v /var/run/docker.sock:/var/run/docker.sock` is *very important*. 
  > This makes the UNIX socket, which the docker daemon listens to by default, available to the container.
  > The container needs this to proxy a subset of the Docker remote API to voxel-dockerclient.
  > If you leave this out by mistake, voxel-dockerclient will not work.

3. Browse to: `http://localhost:8080`.

### Build the docker image locally
Finally, you can clone the github repository and use the multi-stage Dockerfile that is included. This will pull relevant node and golang images, and perform the build using those. The steps are:

1. Clone the github repository with:

```
git clone https://github.com/rajch/voxel-dockerclient.git
```
2. Change to the cloned directory and run:
```
docker build -t voxel-dockerclient:local .
```
3. Run
```
docker run -d -v /var/run/docker.sock:/var/run/docker.sock -p 8080:8080 voxel-dockerclient:local
```
4. Browse to `http://localhost:8080`

Or, you could use the provided docker compose manifest file, by running:

```
docker compose up -d
```

Your logged-in user needs to be a member of the `docker` group for this to work.

## How to use voxel-dockerclient
Instructions are available [here](https://rajch.github.io/voxel-dockerclient/).

## Browser compatibility
voxel-dockerclient has been tested using recent Chrome and Firefox browsers, on Linux and Windows.

## What's next?
I intend to add the following capabilities quickly:
* ~~`docker logs` equivalent~~ ** DONE
* ~~`docker attach` equivalent~~ ** DONE
* `docker pull` equivalent
* ~~A better interface for the `create` command~~ ** DONE
* ~~*Some* security~~ ** DONE

~~In the pipeline, further down, are:~~
~~* volumes~~
~~* networks~~
~~* image management, including building new images~~

~~I don't really know how far I want to take this. I do want voxel-dockerclient to be complete, but I want to keep it simple. I may turn it into a teaching tool eventually.~~

This project is now in maintenance mode. See the [How does it work](#how-does-it-work) section below for details.

## [How does it work]?
~~On the server, voxel-dockerclient uses [Express](http://expressjs.com/) and the excellent [dockerode](https://github.com/apocas/dockerode) node module to provide a proxy for a subset of the Docker remote API.~~

~~The voxel-dockerclient server is simply nginx, proxying the docker daemon's UNIX socket.~~

The voxel-dockerclient server is a tiny golang program, which serves the client HTML/CSS/javascript, and provides a proxy for the docker API. At the moment, it proxies the full API with ~~no~~ some authorization. ~~This will change.~~

On the client, it uses the brilliant [voxeljs](http://voxeljs.com/) family of node modules to render the UI, and the ~~[axios](https://github.com/mzabriskie/axios) node module~~ fetch API to communicate with the proxied API.

I have used an older flavour of the main voxeljs module, voxel-engine. I had to fork it because of some incompatibilities with later modules. The original is [here](https://github.com/maxogden/voxel-engine), and my forked version [here](https://github.com/rajch/voxel-engine).
The same treatment had to be given for a voxeljs plugin called voxel-keys. The original is [here](https://github.com/voxel/voxel-keys), and my fork [here](https://github.com/rajch/voxel-keys).

> [!NOTE]
> And therein lies the problem. As of 2024, the voxeljs family of modules have not been updated in a decade. Some of the source code has disappeared from Github. While the modules remain on NPM, many of them depend on ancient versions of [three.js](https://threejs.org) that have known vulnerabilities. I would have to reverse engineer a lot of modules if I wanted to upgrade everything to a modern version.
>
> So, voxel-dockerclient continues to use (indirectly) three.js versions 0.54.0 and 0.56.0, which have [known issues](https://github.com/advisories/GHSA-fq6p-x6j3-cmmq), and is now in maintenance mode. 

The code is open source, under the MIT license. I would love contribution, in the form of issue reporting, feature requests, pull requests, anything. 

## Acknowledgements
I would like to thank:

* The fine folk of @docker, for Docker
* The fine folk behind the voxeljs family of modules: @github/maxogden, @github/kumavis, @github/deathcap, @github/substack et al
* The authors of the dockerode and axios modules, although those modules are no longer used in this project
* My partner, Chitra Raghavan (@github/chitradoc), for contributing the player model, testing, and bearing with me while I was building this
