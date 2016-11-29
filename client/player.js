var dockerplayer = function (game) {
  var voxelplayer = require('voxel-player')(game);
  var player = voxelplayer('artpacks/player.png');

  player.pov('third');
  player.position.set(2, 2, 0);
  player.possess();


  /*
  var voxelfly = require('voxel-fly')(game);
  voxelfly(player);
  */

  var walker = require('voxel-walk');

  game.on('tick', function () {
    walker.render(player.playerSkin);
    var vx = Math.abs(player.velocity.x);
    var vz = Math.abs(player.velocity.z);
    if (vx > 0.001 || vz > 0.001) {
      walker.stopWalking();
    } else {
      walker.startWalking();
    }
  });

  /*
  var registry = game.plugins.get('voxel-registry');
  registry.registerItem('debian', { itemTexture: 'i/diamond', displayName: 'debian:latest' });
  registry.registerItem('httpd', { itemTexture: 'i/diamond', displayName: 'httpd:latest' });

  var inventory = game.plugins.get('voxel-carry').inventory;
  inventory.give(new ItemPile("debian", 4));
  inventory.give(new ItemPile("httpd", 6));


  var keys = game.plugins.get('voxel-keys');
  var inventorydialog = new InventoryDialog(game, {});
  keys.down.on('inventory', function () {
    inventorydialog.open();
  })
  */
}

module.exports = dockerplayer;