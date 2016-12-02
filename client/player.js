var dockerplayer = function (world) {
    const game = world.game();

    var voxelplayer = require('voxel-player')(game);
    var player = voxelplayer('textures/player.png');
    var blockdata = game.plugins.get('voxel-blockdata');

    player.pov('third');
    player.position.set(2, 2, 0);
    player.possess();



    var voxelfly = require('voxel-fly')(game);
    var flyer = voxelfly(player);


    var walker = require('voxel-walk');

    game.on('tick', function () {
        if (!flyer.flying) {
            walker.render(player.playerSkin);
            var vx = Math.abs(player.velocity.x);
            var vz = Math.abs(player.velocity.z);
            if (vx > 0.001 || vz > 0.001) {
                walker.stopWalking();
            } else {
                walker.startWalking();
            }
        }
    });

    var keys = game.plugins.get('voxel-keys');
    keys.down.on('pov', function () {
        player.toggle();
    });

    this.gohome = function () {
        player.moveTo(world.containerOrigin[0], 2, 0);
    }

    this.gotonextslot = function () {
        player.moveTo(world.getNextContainerPosition(), 2, 0);
    }

    this.moveToContainer = function (name) {
        var citem = world.getContainer(name);
        if (citem) {
            player.moveTo(citem.getPosition()[0] + 2, 2, -5);
        } else {
            throw new Error('Could not find a container called "' + name + "'.");
        }
    }

    this.getPosition = function () {
        return [Math.round(player.position.x), Math.round(player.position.y), Math.round(player.position.z)]
    }

    this.getAdjacentContainerName = function () {
        var camvec = world.game().cameraVector().map(function (cv) { return Math.round(cv) });
        var ppos = this.getPosition();
        var cpos = ppos.map(function (cv, index) { return cv + camvec[index]; });

        return blockdata.get(cpos[0], cpos[1], cpos[2]);
    }
}

module.exports = dockerplayer;