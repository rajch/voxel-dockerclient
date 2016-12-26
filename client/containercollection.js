const CONTAINERORIGIN = [ 0, 2, -4 ];
const CWIDTH = 3;
const CHEIGHT = 3;
const CDEPTH = 3;
const CPADDEDWIDTH = 4;

/** Container States
 *  @enum {string}
 */
global.CONTAINERSTATE = {
  'created' : 'created',
  'restarting' : 'restarting',
  'running' : 'running',
  'paused' : 'paused',
  'exited' : 'exited',
  'dead' : 'dead'
};

/** A docker container as represented in voxel-dockerclient
 *  @constructor
 *  @param {module:world~dockerworld} world
 *  @param {string} name - Name of the container
 *  @param {Object} [dockerdata] - Data returned by docker containers/json or inspect/json APIs
 */
var Container = function(world, name, dockerdata, startXposition) {
  const game = world.game();
  const thiscontainer = this;

  const client = world.apiClient;

  const T = game.THREE;

  dockerdata = dockerdata || {};

  /** Container State
   *  @type CONTAINERSTATE
   */
  var state = dockerdata.State || CONTAINERSTATE.exited;

  var containerstartpos = [ startXposition, CONTAINERORIGIN[1], CONTAINERORIGIN[2] - CDEPTH ];
  var containerendpos = [ containerstartpos[0] + CWIDTH, CONTAINERORIGIN[1] + CHEIGHT, CONTAINERORIGIN[2] ];

  var containertitle;

  function drawContainer()
  {
    // Draw the container shape
    game.blocks(containerstartpos, containerendpos, function(x, y, z, i) {
      if((x === containerstartpos[0] || x === containerendpos[0] - 1) &&
             (z === containerstartpos[2] || z === containerendpos[2] - 1) ||
         y == CONTAINERORIGIN[1] + CHEIGHT - 1 || y == CONTAINERORIGIN[1])  {
        game.setBlock([ x, y, z ], 'container');
      } else {
        if(state !== CONTAINERSTATE.running) {
          game.setBlock([ x, y, z ], 'exited');
        } else {
          game.setBlock([ x, y, z ], 'running');
        }
      }
    });

    if(!containertitle) {
      // Draw the container name
      var textGeometry = new T.TextGeometry(name + "(" + dockerdata.Image + ")|" + dockerdata.Command, {
        size : 0.1,
        height : 0.1,
        curveSegments : 2,
        font : 'droid sans',
        weight : 'normal',
        bevelThickness : 0.1,
        bevelSize : 1,
        bevelEnabled : false
      });

      var textMaterial = new T.MeshBasicMaterial({ color : 0x325722 });

      var mesh = new T.Mesh(textGeometry, textMaterial);
      mesh.position.set(containerstartpos[0], CONTAINERORIGIN[1] + CHEIGHT + 0.15, containerendpos[2]);

      containertitle = game.addItem({
        mesh : mesh,
        size : 3,
        height : 1,
        blockscreation : true /*, velocity : { x : 0, y : 0, z : 0 } */
      });

      // containertitle.subjectTo([0, 0, 0]);
    }
  }

  this.destroy = function() {
    if(containertitle)
      game.removeItem(containertitle);

    game.blocks(containerstartpos, containerendpos, function(x, y, z, i) { game.setBlock([ x, y, z ], 0); });

    return containerstartpos[0]; // return the starting X position
  };

  this.getPosition = function() { return containerstartpos; };

  this.redraw = drawContainer;

  /** Set current state of container
   *  @method
   *  @param {CONTAINERSTATE} newstate
   *  @returns dockercontainer
   *
   */
  this.setState = function(newstate) {
    state = newstate;
    drawContainer();
  };

  /** Get current state of container
   *  @method
   *  @returns CONTAINERSTATE
   */
  this.getState = function() { return state; };

  this.inspect = function(successCallback, errorCallback) {
    client.inspectcontainer(name,
                            {},
                            function(success) { successCallback.call(this, success); },
                            function(error) { errorCallback.call(this, error); })
  };

  this.top = function(successCallback, errorCallback) {
    client.topcontainer(name,
                        {},
                        function(success) { successCallback.call(this, success); },
                        function(error) { errorCallback.call(this, error); })
  };

  this.logs = function(successCallback, errorCallback) {
    client.logscontainer(name,
                         {},
                         function(success) { successCallback.call(this, success); },
                         function(error) { errorCallback.call(this, error); })
  };

  this.start = function(successCallback, errorCallback) {
    client.startcontainer(name,
                          {},
                          function(success) {
                            state = CONTAINERSTATE.running;
                            drawContainer();
                            successCallback.call(this, success);
                          },
                          function(error) { errorCallback.call(this, error); });
  };

  this.stop = function(successCallback, errorCallback) {
    client.stopcontainer(name,
                         {},
                         function(success) {
                           state = CONTAINERSTATE.exited;
                           drawContainer();
                           successCallback.call(this, success);
                         },
                         function(error) { errorCallback.call(this, error); });
  };

  this.name = function() { return name; }
};

/** A collection of containers as represented in voxel-dockerclient
 *  @constructor
 *  @param {module:world~dockerworld} world
 */
var dockercontainercollection = function(world) {
  var thiscollection = this;
  const client = world.apiClient;

  var containers = [];
  var containernames = {};

  var nextcontainerposition = [0];

  function getContainerOrdinalFromX(x)
  {
    return Math.trunc((x - CONTAINERORIGIN[0]) / 4);
  }

  function getNextContainerPosition()
  {
    return nextcontainerposition[nextcontainerposition.length - 1];
  };

  function addContainerToWorld(containername, dockerdata)
  {
    if(containernames[containername])
      throw new Error('A container called ' + containername + ' already exists.');
    var citem = new Container(world, containername, dockerdata, getNextContainerPosition());

    containernames[containername] = containers.push(citem) - 1; // Array.push returns length of array

    if(nextcontainerposition.length === 1) {
      nextcontainerposition[0] += CPADDEDWIDTH;
    } else {
      nextcontainerposition.pop();
    }

    return citem;
  }

  function removeContainerFromWorld(containername)
  {
    var itemindex = containernames[containername];
    if(!itemindex)
      throw new Error('There is no container called ' + containername + '.');
    var citem = containers[itemindex];

    var destroyedpos = citem.destroy();

    if(itemindex === (containernames.length - 1)) {
      nextcontainerposition[0] -= CPADDEDWIDTH;
    } else {
      nextcontainerposition.push(destroyedpos);
    }

    containers[itemindex] = undefined;
    delete containernames[containername];
  }

  function maxContainerChunkX()
  {
    return (containers.length * CPADDEDWIDTH) >> world.game().voxels.chunkBits;
  }

  function redrawContainersInChunk(chunkposition)
  {

    if(chunkposition[1] === 0 && chunkposition[2] === -1 && chunkposition[0] >= 0) {
      if(chunkposition[0] <= maxContainerChunkX()) {
        var rc = world.game().voxels.generateChunk(chunkposition[0], chunkposition[1], chunkposition[2]);
        world.game().pendingChunks.pop();

        var startXpos = chunkposition[0] << world.game().voxels.chunkBits;
        var firstContainer = getContainerOrdinalFromX(startXpos);
        var lastContainer = firstContainer + Math.floor(world.game().chunkSize / CPADDEDWIDTH);
        lastContainer = Math.min(lastContainer, containers.length);
        for(var i = firstContainer; i < lastContainer; i++) {
          if(containers[i])
            containers[i].redraw();
        }
        rc = world.game().voxels.chunks[chunkposition.join('|')];
        world.game().showChunk(rc);
      }
    }
  }

  function getContainerAtPosition(pos)
  {
    var retval;
    if(pos[1] >= CONTAINERORIGIN[1] && pos[1] < CONTAINERORIGIN[1] + CHEIGHT && pos[2] >= CONTAINERORIGIN[2] - CDEPTH &&
       pos[2] <= CONTAINERORIGIN[2]) {
      var containerindex = getContainerOrdinalFromX(pos[0]);
      if(containerindex >= 0)
        retval = containers[containerindex];
    }
    return retval;
  }

  function createcontainerinworld(createparams, successCallback, errorCallback)
  {
    // { Image : 'debian', Tty : true, Cmd : ['/bin/bash'], name : 'Lovely_Chitra' }
    client.createcontainer(
          createparams,
          function onContainerCreate(success) { widget.log('Success:' + JSON.stringify(success)); },
          function onContainerCreateError(err) { widget.log('Lagi:' + JSON.stringify(err)); });
  }

  /** Add a container to the world
   *  @method
   *  @param {string} containername
   *  @param {any} dockerData
   *  @returns Container
   *
   */
  this.add = addContainerToWorld;

  /** Removes a container from the world
   *  @method
   *  @param {string} containername
   */
  this.remove = removeContainerFromWorld;

  /** Gets the next available X position for a containernames
   *  @method
   *  @returns int
   */
  this.getNextContainerPosition = getNextContainerPosition;

  /** Draws containers in a chunk
   *  @method
   *  @param {array} chunkposition
   */
  this.drawContainers = redrawContainersInChunk;

  /** Gets a container object by name
   *  @method
   *  @param {string} name - A container name
   *  @returns Container
   */
  this.getContainer = function(name) {
    var itemindex = containernames[name];
    return itemindex !== undefined ? containers[itemindex] : itemindex;
  };
  /** Draws containers in a chunk
   *  @method
   *  @param {array} chunkposition
   */
  this.drawContainers = redrawContainersInChunk;

  /** Gets a container object by position
   *  @method
   *  @param {Array.int} pos - A position array [x, y, z]
   *  @returns Container
   */
  this.getContainerAtPosition = getContainerAtPosition;
};

module.exports = dockercontainercollection;