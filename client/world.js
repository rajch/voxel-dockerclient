// voxel-plugins needs a require for all plugins, for browserify
require('voxel-keys');
require('voxel-console');

var Player = require('./player');
var ContainerCollection = require('./containercollection');
var ApiClient = require('./apiclient');
var GameConsole = require('./gameconsole');
var Dialog = require('./dialog');
var Commands = require('./commands');

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
  var commands = new Commands(thisworld);
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
  opts.materials = [ [ 'grass', 'dirt', 'grass_dirt' ], 'brick', 'dirt', 'plank', 'container', 'exited', 'running' ];
  opts.generateChunks = true;
  opts.generate = function flatLand(x, y, z) { return y == 1 ? 1 : 0; };
  opts.startingPosition = [ 0, 2, 0 ];

  var voxelengine = require('voxel-engine');
  game = voxelengine(opts);

  game.appendTo(opts.parentElement);

  // Handle container drawing when chunks are loaded/unloaded
  game.voxels.on('missingChunk', function onWorldMissingChunk(chunkposition) { cc.drawContainers(chunkposition); });

  // Ugly hacks
  global.Gworld = thisworld;
  global.Ggame = game;
  window._typeface_js = { faces : game.THREE.FontUtils.faces, loadFace : game.THREE.FontUtils.loadFace };

  // Add plugins
  var plugins = require('voxel-plugins')(game, { require : require });
  plugins.add('voxel-keys', {});
  plugins.add('voxel-console', {});

  plugins.loadAll();

  function listContainers(successHandler, errorHandler)
  {
    apiclient.listcontainers({},
                             function(success) {
                               var i;
                               for(i = 0; i < success.data.length; i++) {
                                 cc.add(success.data[i].Names[0].substring(1), success.data[i]);
                               }
                               cc.drawContainers([ 0, 0, -1 ]);
                               cc.drawContainers([ 1, 0, -1 ]);
                               if(successHandler) {
                                 successHandler.call(thisworld, success.data);
                               }
                             },
                             function(error) {
                               this.log(error);
                               if(errorHandler) {
                                 errorHandler.call(thisworld, error);
                               }
                             });
  }

  this.options = function() { return opts; };

  this.containers = cc;
  this.commands = commands;
  this.apiClient = apiclient;

  this.game = function() { return game; };

  player = new Player(thisworld);
  this.player = function() { return player; };

  dialog = new Dialog(thisworld);
  this.dialog = function() { return dialog; };

  gameconsole = new GameConsole(thisworld);

  this.log = gameconsole.log;
  this.logUsage = gameconsole.logUsage;
  this.logWarning = gameconsole.logWarning;
  this.logError = gameconsole.logError;
  this.tablify = gameconsole.tablify;

  listContainers(function listContainersSuccess(){
    gameconsole.log('Type help and press enter to see available commands.');
    gameconsole.executeCommand('welcome');
  });


};

module.exports = dockerworld;