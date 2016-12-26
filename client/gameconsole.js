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

  function tablify(tabledata)
  {
    var header;
    var bodyrows;
    var body;
    var table;

    bodyrows = tabledata.body.map(function(row){ return row.map(function(cell) { return '<td>' + cell + '</td>' }) });
    body = '<tbody>' + bodyrows.map(function(row) { return '<tr>' + row.join('') + '</tr>'; }).join('') + '</tbody>';

    table = '<table>';
    if(tabledata.header) {
      header =
          '<thead>' + tabledata.header.map(function(cell) { return '<th>' + cell + '</th>'; }).join('') + '</thead>';
      table += header;
    }
    table += body;

    return table;
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
  
    /** Execute a command
   *  @method
   *  @param {string} name - Name of the command to executeCommand
   *  @param {any} arguments - Arguments to pass to a command. No checks are done at this point
   */
   this.executeCommand = commands.execute;

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

  /** Change an object with a header and a body array to an HTML table
   *  @method
   *  @param {object} tabledata - Object in the form { header:[], body: [[]] }
   *  @returns {string} - HTML table
   */
  this.tablify = tablify;
};

module.exports = dockergameconsole;
