var player = function (world) {
  const game = world.game()

  var voxelplayer = require('voxel-player')(game)
  var player = voxelplayer('textures/player.png')

  player.pov('third')
  player.position.set(2, 2, 0)
  player.possess()

  var voxelfly = require('voxel-fly')(game)
  var flyer = voxelfly(player)

  var walker = require('voxel-walk')

  game.on('tick', function () {
    if (!flyer.flying) {
      walker.render(player.playerSkin)
      var vx = Math.abs(player.velocity.x)
      var vz = Math.abs(player.velocity.z)
      if (vx > 0.001 || vz > 0.001) {
        walker.stopWalking()
      } else {
        walker.startWalking()
      }
    }
  })

  var keys = game.plugins.get('voxel-keys')
  keys.down.on('pov', function () { player.toggle() })

  function goHome () {
    player.moveTo(2, 2, 0)
  };

  function goToNextSlot () {
    player.moveTo(world.containers.getNextContainerPosition(), 2, 0)
  };

  function moveToContainer (name) {
    var citem = world.containers.getContainer(name)
    if (citem) {
      player.moveTo(citem.getPosition()[0] + 2, 2, 0)
    } else {
      throw new Error('There is no container called ' + name + '.')
    }
  }

  function getPosition () {
    return [ Math.round(player.position.x), Math.round(player.position.y), Math.round(player.position.z) ]
  }

  function getAdjacentContainer () {
    var camvec = world.game().cameraVector().map(function (cv) { return Math.round(cv) })
    var ppos = getPosition()
    var cpos = ppos.map(function (cv, index) { return cv + camvec[index] })

    return world.containers.getContainerAtPosition(cpos)
  }

  function getAdjacentContainerName () {
    var citem = getAdjacentContainer()
    return citem !== undefined ? citem.name() : citem
  }

  function gotoPosition (pos) {
    player.moveTo(pos[0], pos[1], pos[2])
  }

  this.gohome = goHome

  this.gotonextslot = goToNextSlot

  this.moveToContainer = moveToContainer

  this.getPosition = getPosition

  this.getAdjacentContainer = getAdjacentContainer

  this.getAdjacentContainerName = getAdjacentContainerName

  this.gotoPosition = gotoPosition
}

module.exports = player
