var shellwords = require('shellwords');

var dockergameconsole = function (world) {
    const game = world.game();
    var voxelconsole = game.plugins.get('voxel-console');
    var widget = voxelconsole.widget;

    var commands = {
        "create": createcommand,
        "delete": deletecommand,
        "rm": deletecommand,
        "remove": deletecommand,
        "go": gocommand
    }

    voxelconsole.keys.down.on('openconsole', function () {
        voxelconsole.open("");
    });

    widget.on('input', process);

    function createcommand(arguments) {
        if (arguments.length > 1) {
            world.addcontainer(arguments[1]);
        } else {
            widget.log('Create what ?');
        }
    }

    function deletecommand(arguments) {
        if (arguments.length > 1) {
            world.removecontainer(arguments[1]);
        } else {
            widget.log('Remove what ?');
        }
    }

    function gotocontainer(name) {
        world.player().moveToContainer(name);
    }

    function gocommand(arguments) {
        if(arguments.length > 1) {
            var arg = arguments[1];
            switch(arguments[1]) {
                case "home":
                    world.player().gohome();
                    break;
                case "nextslot":
                    world.player().gotonextslot();
                    break;
                default:
                    gotocontainer(arg);
                    break;
            }
        } else {
            widget.log("Usage: go home or go nextslot or go <containername>")
        }
    }



    function process(text) {
        if(!text) return;
        widget.log(">" + text);
        widget.logNode(document.createElement('br'));
        try {
            var argv = shellwords.split(text);
            var command =commands[argv[0]];
            if(command) {
                command(argv);
            } else {
                widget.log('I do not recognize the "' + argv[0] + '" command.')
            }
        }
        catch (err) {
            widget.log(err);
        }
        widget.logNode(document.createElement('br'));
    }

    this.log = function (message) {
        widget.log(message);
    }

}

module.exports = dockergameconsole;
