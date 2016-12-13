var shellwords = require('shellwords');

var dockergameconsole = function(world) {
  const game = world.game();
  var voxelconsole = game.plugins.get('voxel-console');
  var blockdata = game.plugins.get('voxel-blockdata');

  var widget = voxelconsole.widget;

  var commands = {
    "create" : createcommand,
    "delete" : deletecommand,
    "rm" : deletecommand,
    "remove" : deletecommand,
    "go" : gocommand,
    "inspect" : inspectcommand,
    "start" : startcommand,
    "stop" : stopcommand,
    "t" : testcommand
  };

  voxelconsole.keys.down.on('openconsole', function() { voxelconsole.open(""); });

  widget.on('input', process);

  function createcommand(arguments)
  {
    if(arguments.length > 1) {
      world.addcontainer(arguments[1]);
    } else {
      widget.log('Create what ?');
    }
  }

  function deletecommand(arguments)
  {
    if(arguments.length > 1) {
      world.removecontainer(arguments[1]);
    } else {
      widget.log('Remove what ?');
    }
  }

  function gotocontainer(name)
  {
    world.player().moveToContainer(name);
  }

  function gocommand(arguments)
  {
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
      widget.log("Usage: go home or go nextslot or go <containername>");
    }
  }

  function doinspectcommand(arg)
  {
    world.apiclient().inspectcontainer(arg.name(),
                                       {},
                                       function(success) {
                                         var dialog = world.dialog();
                                         dialog.html('<h1>Inspecting ' + arg + '</h2><div>' +
                                                     JSON.stringify(success.data) + '</div>');
                                         dialog.open();

                                       },
                                       function(error) { widget.log(error); });
  }

  function inspectcommand(arguments)
  {
    var container;
    if(arguments.length > 1) {
      container = world.containers.getContainer(arguments[1]);
      if(container) {
        doinspectcommand(container);
      }
    } else {
      var cn = world.player().getAdjacentContainer();
      if(cn) {
        // container = world.getContainer(cn);
        doinspectcommand(cn);
      } else {
        widget.log('Either stand in front of a container or use: inspect <containername>');
      }
    }
  }

  function onstartstopError(errordata)
  {
    if(errordata && errordata.response && errordata.response.statusText) {
      widget.log("Error:" + errordata.response.statusText);

    } else {
      widget.log("Error:" + errordata);
    }
  }

  function dostartcommand(container)
  {
    container.start(function(successdata) { widget.log(container.getState()); }, onstartstopError);
  }

  function startcommand(arguments)
  {
    var cn = arguments[1] || world.player().getAdjacentContainerName();
    if(cn) {
      dostartcommand(world.getContainer(cn));
    } else {
      widget.log('Either stand in front of a container or use: start <containername>');
    }
  }

  function dostopcommand(container)
  {
    container.stop(function(successdata) { widget.log(container.getState()); }, onstartstopError);
  }

  function stopcommand(arguments)
  {
    var cn = arguments[1] || world.player().getAdjacentContainerName();
    if(cn) {
      dostopcommand(world.getContainer(cn));
    } else {
      widget.log('Either stand in front of a container or use: stop <containername>');
    }
  }

  function testcommand(arguments)
  {
    var cn = arguments[1] || world.player().getAdjacentContainerName();
    if(cn) {
      dostartcommand(world.getContainer(cn));
    } else {
      widget.log('Either stand in front of a container or use: start <containername>');
    }
  }

  function process(text, quiet)
  {
    if(!text)
      return;

    if(!quiet) {
      widget.log("> " + text);
      widget.logNode(document.createElement('br'));
    }
    try {
      var argv = shellwords.split(text);
      var command = commands[argv[0].toLowerCase()];
      if(command) {
        command(argv);
      } else {
        widget.log('I do not recognize the "' + argv[0] + '" command.')
      }
    } catch(err) {
      widget.log(err);
    }
    if(!quiet) {
      widget.logNode(document.createElement('br'));
    }
  }

  this.log = function(message) { widget.log(message); };

  this.doCommand = process;

};

module.exports = dockergameconsole;
