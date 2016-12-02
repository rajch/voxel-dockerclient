var shellwords = require('shellwords');

var dockergameconsole = function (world) {
    const game = world.game();
    var voxelconsole = game.plugins.get('voxel-console');
    var blockdata = game.plugins.get('voxel-blockdata');
    var widget = voxelconsole.widget;

    var commands = {
        "create": createcommand,
        "delete": deletecommand,
        "rm": deletecommand,
        "remove": deletecommand,
        "go": gocommand,
        "inspect": inspectcommand,
        "t": testcommand
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
        if (arguments.length > 1) {
            var arg = arguments[1];
            switch (arguments[1]) {
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

    function doinspectcommand(arg) {
        world.apiclient().inspectcontainer(arg, {}, function (success) {
            var dialog = world.dialog();
            dialog.html(JSON.stringify(success.data));
            dialog.open();

        }, function (error) {
            widget.log(error);
        })
    }

    function inspectcommand(arguments) {
        if (arguments.length > 1) {
            var container = world.getContainer(arguments[1]);
            if (container) {
                doinspectcommand(arguments[1]);
            }
        } else {
            var cn = world.player().getAdjacentContainerName();
            if(cn) {
                doinspectcommand(cn);
            } else {
                widget.log('Either stand in front of a container or use: inspect <containername>');
            }
        }
    }

    function testcommand(arguments) {
        var camvec = world.game().cameraVector().map(function (cv) { return Math.round(cv) });
        var ppos = world.player().getPosition();
        var cpos = ppos.map(function (cv, index) { return cv + camvec[index]; });
        widget.log('Testing :' +
            ' Camera: ' + camvec +
            ' Player:' + ppos +
            ' Probe:' + cpos +
            ' Container:' + blockdata.get(cpos[0], cpos[1], cpos[2]));
    }


    function process(text) {
        if (!text) return;
        widget.log(">" + text);
        widget.logNode(document.createElement('br'));
        try {
            var argv = shellwords.split(text);
            var command = commands[argv[0].toLowerCase()];
            if (command) {
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

    this.doCommand = process;

}

module.exports = dockergameconsole;
