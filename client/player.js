const player = function (world) {
  const game = world.game()

  const voxelplayer = require('voxel-player')(game)
  const player = voxelplayer('textures/player.png')

  player.pov('third')
  player.position.set(2, 2, 0)
  player.possess()

  const voxelfly = require('voxel-fly')(game)
  const flyer = voxelfly(player)

  const walker = require('voxel-walk')

  game.on('tick', function () {
    if (!flyer.flying) {
      walker.render(player.playerSkin)
      const vx = Math.abs(player.velocity.x)
      const vz = Math.abs(player.velocity.z)
      if (vx > 0.001 || vz > 0.001) {
        walker.stopWalking()
      } else {
        walker.startWalking()
      }
    }
  })

  const keys = game.plugins.get('voxel-keys')
  keys.down.on('pov', function () { player.toggle() })

  function goHome () {
    player.moveTo(2, 2, 0)
  };

  function goToNextSlot () {
    player.moveTo(world.containers.getNextContainerPosition(), 2, 0)
  };

  function moveToContainer (name) {
    const citem = world.containers.getContainer(name)
    if (citem) {
      player.moveTo(citem.getPosition()[0] + 2, 2, 0)
    } else {
      throw new Error('There is no container called ' + name + '.')
    }
  }

  function getPosition () {
    return [Math.round(player.position.x), Math.round(player.position.y), Math.round(player.position.z)]
  }

  function getAdjacentContainer () {
    const camvec = world.game().cameraVector().map(function (cv) { return Math.round(cv) })
    const ppos = getPosition()
    const cpos = ppos.map(function (cv, index) { return cv + camvec[index] })

    return world.containers.getContainerAtPosition(cpos)
  }

  function getAdjacentContainerName () {
    const citem = getAdjacentContainer()
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
