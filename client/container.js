var dockercontainer = function (world, name) {
    const game = world.game();
    const T = game.THREE;
    const CWIDTH = 3;
    const CHEIGHT = 5;
    const CDEPTH = 3;

    var blockdata = game.plugins.get('voxel-blockdata');

    var playerpos = world.containerOrigin;
    var containerstartpos = [world.getNextContainerPosition(), 2, playerpos[2]];
    var containerendpos = [containerstartpos[0] + CWIDTH, CHEIGHT, containerstartpos[2] + CDEPTH];
    var bstartpos = [containerstartpos[0]-1, 2, containerstartpos[2]-1];
    var bendpos = [containerendpos[0]+1, containerendpos[1] + 2, containerendpos[2]+1];

    // Draw the container shape
    game.blocks(containerstartpos, containerendpos, function (x, y, z, i) {
        if ((x === containerstartpos[0] || x === containerendpos[0] - 1) && (z === containerstartpos[2] || z === containerendpos[2] - 1) || y == 4) {
            game.setBlock([x, y, z], 3);
        } else {
            game.setBlock([x, y, z], 'plank');
        }
        blockdata.set(x, y, z, name);
    });


    // Draw the container name
    var textGeometry = new T.TextGeometry(name, {
        size: 0.1, height: 0.1, curveSegments: 2,
        font: 'droid sans', weight: 'normal',
        bevelThickness: 0.1, bevelSize: 1, bevelEnabled: false
    });

    var textMaterial = new T.MeshBasicMaterial(
        { color: 0x0000ff }
    );


    var mesh = new T.Mesh(textGeometry, textMaterial);
    mesh.position.set(containerstartpos[0], CHEIGHT * 2, containerendpos[2]);

    var item = game.addItem({
        mesh: mesh,
        size: 3,
        height: 1,
        blockscreation: true,
        velocity: { x: 0, y: 0, z: 0 }
    })

    this.destroy = function () {
        game.removeItem(item);
        game.blocks(containerstartpos, containerendpos, function (x, y, z, i) {

            game.setBlock([x, y, z], 0);

            blockdata.set(x, y, z, undefined);
        });

        return containerstartpos[0]; // return the starting X position
    }

    this.getPosition = function() {
        return containerstartpos;
    }
}

module.exports = dockercontainer;