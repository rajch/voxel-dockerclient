const World = require('./world')

// Initialize the world. Assume options have been placed in window.dockerworldoptions
const world = new World(window.dockerworldoptions)
world.init()
