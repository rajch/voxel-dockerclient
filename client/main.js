var World = require('./world')

// Initialize the world. Assume options have been placed in window.dockerworldoptions
var world = new World(window.dockerworldoptions)
world.init()
