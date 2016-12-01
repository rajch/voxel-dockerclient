var dockerplayer = function(world) {
    const game = world.game();

    var voxelplayer = require('voxel-player')(game);
    var player = voxelplayer('textures/player.png');

    player.pov('third');
    player.position.set(2, 2, 0);
    player.possess();



    var voxelfly = require('voxel-fly')(game);
    var flyer = voxelfly(player);


    var walker = require('voxel-walk');

    game.on('tick', function() {
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
    keys.down.on('pov', function() {
        player.toggle();
    });
}

module.exports = dockerplayer;