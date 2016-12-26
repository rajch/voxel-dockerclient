var shellwords = require('shellwords');

var dockergameconsole = function(world) {
  const game = world.game();
  const voxelconsole = game.plugins.get('voxel-console');
  const widget = voxelconsole.widget;

  const commands = world.commands;

  voxelconsole.keys.down.on('openconsole', openConsole);
  voxelconsole.keys.down.on('inspect', function() { processInput('inspect', true); });

  widget.on('input', processInput);

  function openConsole()
  {
    voxelconsole.open("");
  }

  function processInput(text, quiet)
  {
    if(!text)
      return;

    if(!quiet) {
      logCommand(text);
    }
    try {
      var argv = shellwords.split(text);
      var command = commands.get(argv[0]);
      if(command) {
        if(command.commandType === 'containercommand') {
          var container = argv[1] ? world.containers.getContainer(argv[1]) : world.player().getAdjacentContainer();
          if(!container) {
            logUsage('Either stand in front of a container or use: ' + command.name() + ' <containername>');
          } else {
            command.execute(container);
          }
        } else {
          command.execute(argv);
        }
      } else {
        logError('I do not recognize the "' + argv[0] + '" command.');
      }
    } catch(err) {
      logError(err);
    }
    if(!quiet) {
      widget.logNode(document.createElement('br'));
    }
  }

  function logCommand(text)
  {
    widget.log("> " + text);
    widget.logNode(document.createElement('br'));
  }

  function logUsage(text)
  {
    widget.log(text);
  }

  function logWarning(text)
  {
    widget.log(text);
  }

  function logError(text)
  {
    widget.log(text);
  }

  function log(text)
  {
    widget.log(text);
  }

  /** Log a message
   *  @method
   *  @param {string} message
   */
  this.log = log;

  /** Log a usage message
   *  @method
   *  @param {string} message
   */
  this.logUsage = logUsage;

  /** Log a warning message
   *  @method
   *  @param {string} message
   */
  this.logWarning = logWarning;
  
  /** Log an error message
   *  @method
   *  @param {string} message
   */
  this.logError = logError;

};

module.exports = dockergameconsole;
