// voxel-plugins needs a require for all plugins, for browserify
require('voxel-registry');
require('voxel-blockdata');
require('voxel-keys');
require('voxel-console');

var Player = require('./player');
var ContainerCollection = require('./containercollection');
var ApiClient = require('./apiclient');
var GameConsole = require('./gameconsole');
var Dialog = require('./dialog');

/** The voxel-dockerclient world
 *  @constructor
 *  @params {object} [opts] - World options.
 *
 */
var dockerworld = function(opts) {
  var thisworld = this;
  var game;
  var player;
  var gameconsole;
  var dialog;

  var cc = new ContainerCollection(thisworld);

  var apiclient = new ApiClient();

  opts = opts || {};
  opts.texturePath = opts.texturePath || 'textures/';
  opts.keybindings = opts.keybindings || {
    'W' : 'forward',
    'A' : 'left',
    'S' : 'backward',
    'D' : 'right',
    '<up>' : 'forward',
    '<left>' : 'left',
    '<down>' : 'backward',
    '<right>' : 'right',
    '<mouse 1>' : 'fire',
    '<mouse 3>' : 'firealt',
    '<space>' : 'jump',
    '<shift>' : 'crouch',
    '<control>' : 'alt',
    '`' : 'openconsole',
    'I' : 'inspect',
    'R' : 'pov'
  };
  opts.parentElement = opts.parentElement || document.body;
  opts.container = opts.parentElement;
  opts.statsDisabled = opts.statsDisabled || true;
  opts.artpackpath = opts.artpackpath || 'artpacks/artpack.zip';
  opts.materials = [ [ 'grass', 'dirt', 'grass_dirt' ], 'brick', 'dirt', 'plank' ];
  opts.generateChunks = true;
  opts.generate = function flatLand(x, y, z) { return y == 1 ? 1 : 0; };
  opts.startingPosition = [0, 2, 0];

  var voxelengine = require('voxel-engine');
  game = voxelengine(opts);

  game.appendTo(opts.parentElement);

  // Handle container drawing when chunks are loaded/unloaded
  game.voxels.on('missingChunk', function onWorldMissingChunk(chunkposition) { cc.drawContainers(chunkposition); });

  // Ugly hacks
  global.Gworld = thisworld;
  global.Ggame = game;
  window._typeface_js = { faces : game.THREE.FontUtils.faces, loadFace : game.THREE.FontUtils.loadFace };

  // Load art pack, required for inventory etc.
  var createArtpacks = require('artpacks');
  var artpacks = createArtpacks([opts.artpackpath]);
  game.materials.artPacks = artpacks;

  // Add plugins
  //      voxel-registry, used variously
  //      voxel-blockdata, for storing metadata for actions
  var plugins = require('voxel-plugins')(game, { require : require });
  plugins.add('voxel-registry', {});
  plugins.add('voxel-blockdata', {});
  plugins.add('voxel-keys', {});
  plugins.add('voxel-console', {});

  plugins.loadAll();

  // Artpack-dependent things should be loaded
  // after artpacks
  artpacks.on('loadedAll', function() {

    player = new Player(thisworld);
    dialog = new Dialog(thisworld);

    gameconsole = new GameConsole(thisworld);

    var keys = plugins.get('voxel-keys');
    keys.down.on('inspect', function() { gameconsole.doCommand('inspect', true); });

    listContainers();

    gameconsole.log('Welcome to Voxel-Dockerclient. Have fun.');

  });

  function listContainers()
  {
    apiclient.listcontainers({},
                             function(success) {
                               var i;
                               for(i = 0; i < success.data.length; i++) {
                                 cc.add(success.data[i].Names[0].substring(1), success.data[i]);
                               }
                               cc.drawContainers([ 0, 0, -1 ]);
                               cc.drawContainers([ 1, 0, -1 ]);
                             },
                             function(error) { this.log(error); });
  }

  // this.containerOrigin = CONTAINERORIGIN;

  this.getNextContainerPosition = cc.getNextContainerPosition;

  this.getContainer = cc.getContainer;

  this.game = function() { return game; };

  this.player = function() { return player; };

  this.dialog = function() { return dialog; };

  this.apiclient = function() { return apiclient; };

  this.options = function() { return opts; };

  this.log = function(text) { gameconsole.log(text); };
  
  this.containers = cc;

  this.addcontainer = cc.add;
  this.removecontainer = cc.remove;

};

module.exports = dockerworld;