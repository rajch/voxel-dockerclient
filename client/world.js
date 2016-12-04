// voxel-plugins needs a require for all plugins, for browserify
require('voxel-registry');
require('voxel-blockdata');
require('voxel-keys');
require('voxel-console');

var Player = require('./player');
var Container = require('./container');
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

    var containers = [];
    var containernames = {};
    var nextcontainerposition = [5];

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
        'I' : 'inventory',
        'R' : 'pov'
    };
    opts.parentElement = opts.parentElement || document.body;
    opts.statsDisabled = opts.statsDisabled || true;
    opts.artpackpath = opts.artpackpath || 'artpacks/artpack.zip';
    opts.materials = [ [ 'grass', 'dirt', 'grass_dirt' ], 'brick', 'dirt', 'plank' ]

        var voxelengine = require('voxel-engine');
    game = voxelengine({
        texturePath : opts.texturePath,
        keybindings : opts.keybindings,
        materials : opts.materials,
        container : opts.parentElement,
        statsDisabled : opts.statsDisabled,
        generate : function(x, y, z) { return y == 1 ? 1 : 0; }
    });

    game.appendTo(opts.parentElement);

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
        keys.down.on('inventory', function() { gameconsole.doCommand('inspect'); })

            listContainers();

        gameconsole.log('Welcome to Voxel-Dockerclient. Have fun.');
    });

    function listContainers()
    {
        apiclient.listcontainers({},
                                 function(success) {
                                     var i;
                                     for(i = 0; i < success.data.length; i++) {
                                         addContainerToWorld(success.data[i].Names[0].substring(1), success.data[i]);
                                     }
                                 },
                                 function(error) { this.log(error); })
    }

    function addContainerToWorld(containername, dockerdata)
    {
        if(containernames[containername])
            throw new Error('A container called ' + containername + ' already exists.');
        var citem = new Container(thisworld, containername, dockerdata);

        containernames[containername] = containers.push(citem) - 1; // Array.push returns length of array

        if(nextcontainerposition.length === 1) {
            nextcontainerposition[0] += 5;
        } else {
            nextcontainerposition.pop();
        }
    }

    function removeContainerFromWorld(containername)
    {
        var itemindex = containernames[containername];
        if(!itemindex)
            throw new Error('There is no container called ' + containername + '.');
        var citem = containers[itemindex];

        var destroyedpos = citem.destroy();

        if(itemindex === (containernames.length - 1)) {
            nextcontainerposition[0] -= 5;
        } else {
            nextcontainerposition.push(destroyedpos);
        }

        containers.splice(itemindex, 1);
        delete containernames[containername];
    }

    this.containerOrigin = [ 5, 0, -10 ];

    this.getNextContainerPosition = function() { return nextcontainerposition[nextcontainerposition.length - 1]; };

    this.getContainer = function(name) {
        var itemindex = containernames[name];
        return itemindex !== undefined ? containers[itemindex] : itemindex;
    };

    this.game = function() { return game; };

    this.player = function() { return player; };

    this.dialog = function() { return dialog; };

    this.apiclient = function() { return apiclient; };

    this.options = function() { return opts; };

    this.log = function(text) { gameconsole.log(text); };

    this.addcontainer = addContainerToWorld;
    this.removecontainer = removeContainerFromWorld;
};

module.exports = dockerworld;