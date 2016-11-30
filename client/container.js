var dockercontainer = function (world, name) {
    const game = world.game();
    const T = game.THREE;
    const CWIDTH = 3;
    const CHEIGHT = 5;
    const CDEPTH = 3;

    var blockdata = game.plugins.get('voxel-blockdata');

    var playerpos = [2, 2, 0];
    var containerstartpos = [playerpos[0], 0, playerpos[2] - 10];
    var containerendpos = [containerstartpos[0] + CWIDTH, CHEIGHT, containerstartpos[2] + CDEPTH];


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
    mesh.position.set(containerstartpos[0], CHEIGHT*2, containerendpos[2]);

    var item = game.addItem({
        mesh: mesh,
        size: 3,
        height: 1,
        blockscreation: true,
        velocity: { x: 0, y: 0, z: 0 }  
    })

}

module.exports = dockercontainer;