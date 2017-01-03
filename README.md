# voxel-dockerclient
An experimental Minecraft-like docker client, built using [voxel.js](http://voxeljs.com/). Inspired by [dockercraft](https://github.com/docker/dockercraft).

## What is it?
The dockercraft project turns the official Minecraft client into a docker client. voxel-dockerclient is a pure-javascript, browser-only docker client that provides a similar experiance.

## What is it not?
voxel-dockerclient is not a serious tool for working with docker. It's a fun project (which may grow up to be a teaching aid someday).

> WARNING: Please use voxel-dockerclient on your local machine only.
> It currently doesn't support authentication.
> Every player should be considered a root user! 

## How to run voxel-dockerclient
### Using the docker image
The easiest way is to pull the docker image, and run from that. The steps are as follows:

1. Pull the docker image with

  ```
  docker pull rajchaudhuri/voxel-dockerclient
  ```
  
2. Run it with:

  ```
  docker run -d --name vdc1 -p 5000:8080 -v /var/run/docker.sock:/var/run/docker.sock rajchaudhuri/voxel-dockerclient
  ```

  > The  `-v /var/run/docker.sock:/var/run/docker.sock` is *very important*. 
  > This makes the UNIX socket, which the docker daemon listens to by default, available to the container.
  > The container needs this to proxy a subset of the Docker remote API to voxel-dockerclient.
  > If you leave this out by mistake, voxel-dockerclient will not work.

3. Point your browser to the container. If you run docker directly on your Linux machine, browse to: `http://localhost:5000`.
  If you use docker-machine (for example, with the Docker Toolbox on Windows), find the IP address of your docker machine with
  
  ```
  docker-machine ip default
  ```
  and then browse to that IP address using the port that you mapped in step 2. E.g.: `http://192.17.22.1:5000`

### Running with node.js
Alternatively, if you have node.js installed on your docker host, you can clone the github repository, and run voxel-dockerclient yourself. The steps are:

1. Clone the github repository with

  ```
  git clone https://github.com/rajch/voxel-dockerclient.git
  ```
2. Run

  ```
  npm install
  ```
3. Run

  ```
  npm start
  ```
4. Browse to `http://localhost:8080`

Your logged-in user needs to be a member of the `docker` group for this to work.

## How to use voxel-dockerclient
Instructions are available [here](https://rajch.github.io/voxel-dockerclient/).
## Browser compatibility
voxel-dockerclient has been tested using recent Chrome and Firefox browsers, on Linux and Windows. Regrettably (*I mean it. I actually like that old browser*), it does not work with Internet Explorer.

## What's next?
I intend to add the following capabilities quickly:
* `docker logs` equivalent
* `docker attach` equivalent
* `docker pull` equivalent
* A better interface for the `create` command
* *Some* security

In the pipeline, further down, are:
* volumes
* networks
* image management, including building new images

I don't really know how far I want to take this. I do want voxel-dockerclient to be complete, but I want to keep it simple. I may turn it into a teaching tool eventually.

## How does it work?
On the server, voxel-dockerclient uses [Express](http://expressjs.com/) and the excellent [dockerode](https://github.com/apocas/dockerode) node module to provide a proxy for a subset of the Docker remote API.

On the client, it uses the brilliant [voxeljs](http://voxeljs.com/) family of node modules to render the UI, and the [axios](https://github.com/mzabriskie/axios) node module to communicate with the proxied API.

I am using an older flavour of the main voxeljs module, voxel-engine. I had to fork it because of some incompatibilities with later modules. The original is [here](https://github.com/maxogden/voxel-engine), and my forked version [here](https://github.com/rajch/voxel-engine).
The same treatment had to be given for a voxeljs plugin called voxel-keys. The original is [here](https://github.com/voxel/voxel-keys), and my fork [here](https://github.com/rajch/voxel-keys).

The code is open source, under the MIT license. I would love contribution, in the form of issue reporting, feature requests, pull requests, anything. 

## Acknowledgements
I would like to thank:
* The fine folk of Docker, for Docker
* The fine folk behind the voxeljs family of modules. github/maxogden, github/kumavis, github/deathcap, github/substack et al. These are really nice.
* The authors of the dockerode and axios modules
* My partner, Chitra Raghavan, for contributing the player model, testing, and bearing with me while I was building this
