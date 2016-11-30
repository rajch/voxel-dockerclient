// voxel-plugins needs a require for all plugins, for browserify
require('voxel-registry');
require('voxel-blockdata');


var Player = require('./player');
var Container = require('./container');
var ApiClient = require('./apiclient');

// The docker world
var dockerworld = function (opts) {
    var thisworld = this;
    var game;
    var player;

    var containers = [];
    var containernames = {};
    var nextcontainerposition = [5];

    var apiclient = new ApiClient();

    opts = opts || {}
    opts.texturePath = opts.texturePath || 'textures/';
    opts.keybindings = opts.keybindings || {
        'W': 'forward'
        , 'A': 'left'
        , 'S': 'backward'
        , 'D': 'right'
        , '<up>': 'forward'
        , '<left>': 'left'
        , '<down>': 'backward'
        , '<right>': 'right'
        , '<mouse 1>': 'fire'
        , '<mouse 3>': 'firealt'
        , '<space>': 'jump'
        , '<shift>': 'crouch'
        , '<control>': 'alt'
        , '`': 'openconsole'
        , 'I': 'inventory'
    };
    opts.container = opts.container || document.body;
    opts.artpackpath = opts.artpackpath || 'artpacks/artpack.zip';
    opts.materials = [['grass', 'dirt', 'grass_dirt'], 'brick', 'dirt', 'plank']

    var voxelengine = require('voxel-engine');
    game = voxelengine({
        texturePath: opts.texturePath,
        keybindings: opts.keybindings,
        materials: opts.materials,
        generate: function (x, y, z) {
            return y == 1 ? 1 : 0;
        }
    });

    game.appendTo(opts.container);

    // Ugly hacks
    global.Gworld = thisworld;
    global.Ggame = game;
    window._typeface_js = { faces: game.THREE.FontUtils.faces, loadFace: game.THREE.FontUtils.loadFace };

    // Load art pack, required for inventory etc.
    var createArtpacks = require('artpacks');
    var artpacks = createArtpacks([opts.artpackpath]);
    game.materials.artPacks = artpacks;

    // Add plugins
    //      voxel-registry, used variously
    //      voxel-blockdata, for storing metadata for actions
    var plugins = require('voxel-plugins')(game, { require: require });
    plugins.add('voxel-registry', {});
    plugins.add('voxel-blockdata', {});

    plugins.loadAll();

    // Artpack-dependent things should be loaded 
    // after artpacks
    artpacks.on('loadedAll', function () {
        player = new Player(thisworld);

        listContainers();

    });

    function listContainers() {
        apiclient.listcontainers({}, function (success) {
            var i;
            for (i = 0; i < success.data.length; i++) {
                console.log(success.data[i]);
                addContainerToWorld(success.data[i].Names[0].substring(1));
            }
        }, function (error) {
            console.log(error);
        })
    }

    function addContainerToWorld(containername) {
        var citem = new Container(thisworld, containername);
        containernames[containername] = containers.push(citem) - 1; // Array.push returns length of array

        if (nextcontainerposition.length === 1) {
            nextcontainerposition[0] += 5;
        } else {
            nextcontainerposition.pop();
        }

    }

    function removeContainerFromWorld(containername) {
        var itemindex = containernames[containername];
        var citem = containers[itemindex];

        var destroyedpos = citem.Destroy();

        if (itemindex === (containernames.length - 1)) {
            nextcontainerposition[0] -= 5;
        } else {
            nextcontainerposition.push(destroyedpos);
        }

        containers.splice(itemindex, 1);
        delete containernames[containername];
    }

    this.containerOrigin = [5, 0, -10];

    this.getNextContainerPosition = function () {
        return nextcontainerposition[nextcontainerposition.length - 1];
    }

    this.game = function () {
        return game;
    }

    this.options = function () {
        return opts;
    }

    this.addcontainer = addContainerToWorld;
    this.removecontainer = removeContainerFromWorld;
}

// Initialize the world. Assume options have been placed in window.dockerworldoptions
var world = new dockerworld(window.dockerworldoptions);
