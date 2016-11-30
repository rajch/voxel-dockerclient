var shellwords = require('shellwords');

var dockergameconsole = function (world) {
    const game = world.game();
    var voxelconsole = game.plugins.get('voxel-console');
    var widget = voxelconsole.widget;

    var commands = {
        "create": createcommand,
        "delete": deletecommand
    }

    voxelconsole.keys.down.on('openconsole', function () {
        voxelconsole.open("");
    });

    widget.on('input', process);

    function createcommand(arguments) {
        if (arguments.length > 0) {
            world.addcontainer(arguments[0]);
        } else {
            widget.log('Create what ?');
        }
    }

    function deletecommand(arguments) {
        if (arguments.length > 0) {
            world.removecontainer(arguments[0]);
        } else {
            widget.log('Remove what ?');
        }
    }


    function process(text) {
        if(!text) return;
        try {
            var argv = shellwords.split(text);
            var command =commands[argv[0]];
            if(command) {
                command(argv.slice(1));
            } else {
                widget.log('I do not recognize the "' + argv[0] + '" command.')
            }
        }
        catch (err) {
            widget.log(err);
        }
    }

    this.log = function (message) {
        widget.log(message);
    }

}

module.exports = dockergameconsole;
