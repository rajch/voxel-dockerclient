// voxel-plugins needs a require for all plugins, for browserify
require('voxel-registry');


var Player = require('./player');

// The docker world
var dockerworld = function (opts) {
    var game;
    var player;

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

    var voxelengine = require('voxel-engine');
    game = voxelengine({
        texturePath: opts.texturePath,
        keybindings: opts.keybindings,
        generate: function (x, y, z) {
            return y == 1 ? 1 : 0;
        }
    });

    game.appendTo(opts.container);

    // Load art pack, required for inventory etc.
    var createArtpacks = require('artpacks');
    var artpacks = createArtpacks([opts.artpackpath]);
    game.materials.artPacks = artpacks;

    // Add plugins
    //      voxel-registry, used variously
    var plugins = require('voxel-plugins')(game, { require: require });
    plugins.add('voxel-registry', {});

    plugins.loadAll();

    // Artpack-dependent things should be loaded 
    // after artpacks
    artpacks.on('loadedAll', function () {
        player = new Player(game);
    })
}

// Initialize the world. Assume options have been placed in window.dockerworldoptions
var world = new dockerworld(window.dockerworldoptions);