# voxel-dockerclient
An experimental Minecraft-like docker client, built using [voxel.js](http://voxeljs.com/). Inspired by [dockercraft](https://github.com/docker/dockercraft).

## What is it?
The @docker/dockercraft project turns the official Minecraft client into a docker client. voxel-dockerclient is a pure-javascript, browser-only docker client that provides a similar experiance.

## What is it not?
voxel-dockerclient is not a serious tool for working with docker. It's a fun project (which may grow up to be a teaching aid someday).

## How to run voxel-dockerclient
### Using the docker image
The easiest way is to pull the docker image, and run from that. The steps are as follows:
1. Pull the docker image with
    ```
    docker pull rajchaudhuri/voxel-dockerclient
    ```
2. Run it with:
    ```
    docker run --name vdc1 -p 5000:8080 -v /var/run/docker.sock:/var/run/docker.sock rajchaudhuri/voxel-dockerclient
    ``` 
    The  `-v /var/run/docker.sock:/var/run/docker.sock` is *very important*. This makes the UNIX socket, which the docker daemon
    listens to by default, available to the container. The container needs this to proxy a subset of the Docker remote API to 
    voxel-dockerclient. If you leave this out by mistake, voxel-dockerclient will not work.
3. Point your browser to the container. If you run docker directly on your Linux machine, browse to: `http://localhost:5000`.
    If you use docker-machine (for example, with the Docker Toolbox on Windows), find the IP address of your docker machine with
    ```
    docker-machine ip default
    ```
    and then browse to that IP address using the port that you mapped in step 2. E.g.:
    `http://192.17.22.1:5000`

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
This is the opening screen of voxel-dockerclient.

![Opening screen](https://raw.githubusercontent.com/rajch/voxel-dockerclient/master/docs/img/openingscreen.png)

Press the **\`** key to close the dialog. The same key can be used to open and close the command console, and to close any dialog.

At this point, you should see all your containers, arranged left to right from the oldest to the newest. Running or stopped is indicated by lights on the container.

Look around with your mouse. Move the player around with the WASD keys. The space bar makes the player jump. Double-tapping the space bar makes the player fly.

While flying, the space bar takes the player higher, and the shift key lower. Once the player hits the ground, running will start again.

Open the command console, and try the commands. Currently, the following commands are available:
    <table><thead><tr><th>Command</th><th>Description</th></tr></thead><tbody><tr><td>help</td><td>Shows all available commands</td></tr><tr><td>inspect</td><td>Inspects a container</td></tr><tr><td>top</td><td>Shows processes running in a container</td></tr><tr><td>start</td><td>Starts a container</td></tr><tr><td>stop</td><td>Stops a container</td></tr><tr><td>go</td><td>Takes player to a container, or to the first or last container. Type go home if you get lost.</td></tr><tr><td>remove</td><td>Deletes a container</td></tr><tr><td>create</td><td>Creates a container</td></tr><tr><td>welcome</td><td>Shows the welcome message</td></tr><tr><td>refresh</td><td>Re-fetches container list</td></tr><tr><td>restart</td><td>Restarts voxel-dockerclient. Use as a last resort.</td></tr></tbody></table>

Of these, the container-related commands like `start`, `stop`, `top`, `remove` and `inspect` can be invoked in two ways: either by using the `\<command\> \<containername\>` syntax, or by positioning the player exactly next to a container, and using just `\<command\>`.

When the command console is closed, pressing the **I** key will invoke the `inpect` command. If the player is exactly next to a container, that container will be inspected.

The `create` command allows you to create new containers. Currently, you can only use images already on your docker host. Image pulling will be added in a later release.

Activity performed in other clients, such as the official docker client, will not reflect automatically in voxel-dockerclient. Use the `refresh` command periodincally.

The `go` command can be used to teleport the player to a particular container, using the syntax `go \<containername\>`. `go home` will teleport to the first (oldest) container. `go nextslot` will teleport to the spot where the next new container will appear. 

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
* The fine folk of @docker, for Docker
* The fine folk behind the voxeljs family of modules. @maxogden, @kumavis, @deathcap, @substack et al. These are really nice.
* The authors of the dockerode and axios modules
* My partner, Chitra Raghavan, for contributing the player model, testing, and bearing with me while I was building this