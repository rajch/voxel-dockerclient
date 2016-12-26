/** Voxel-Dockerclient commands
 *  @constructor
 */
function commands(world)
{
  var commands = {};

  /** Voxel-Dockerclient command. 'this' evaluates to world
   *  @constructor
   */
  function Command(name, description, action, commandtype)
  {
    this.name = function() { return name };
    this.execute = function(arguments) { action.call(world, arguments); };
    this.description = description;
    this.commandType = commandtype;
  }

  function addCommand(name, description, action, commandType)
  {
    name = name.toLowerCase();
    var newCommand = new Command(name, description, action, commandType);
    commands[name] = newCommand;
    return newCommand;
  }

  function removeComand(name)
  {
    name = name.toLowerCase();
    delete commands[name];
  }

  function executeCommand(name, arguments)
  {
    name = name.toLowerCase();
    commands[name].execute(arguments);
  }

  function listCommands()
  {
  }

  function getCommand(name)
  {
    name = name.toLowerCase();
    return commands[name];
  }

  function onRequestError(errordata)
  {
    if(errordata && errordata.response && errordata.response.statusText) {
      world.logError("Error:" + errordata.response.statusText);
    } else {
      world.logError("Error:" + errordata);
    }
  }

  // Set up built-in commands

  addCommand('inspect',
             'Inspects a container',
             function inpectCommand(container) {
               container.inspect(function inspectSuccess(success) {
                 var dialog = world.dialog();
                 dialog.html('<h1>Inspecting ' + container.name() + '</h2><div><pre>' +
                             JSON.stringify(success.data, null, '\t') + '</pre></div>');
                 dialog.open();

               }, onRequestError);
             },
             'containercommand');

  addCommand('top',
             'Shows processes running in a container',
             function topCommand(container) {
               var containerState = container.getState();
               if(containerState === CONTAINERSTATE.running || containerState === CONTAINERSTATE.paused) {
                 container.top(function topSuccess(success) {
                   var dialog = world.dialog();
                   dialog.html('<h1>Processes running in ' + container.name() + '</h2><div>' +
                               JSON.stringify(success.data) + '</div>');
                   dialog.open();

                 }, onRequestError);
               } else {
                 world.logUsage('The top command only works with running containers.');
               }
             },
             'containercommand');

  addCommand('start',
             'Starts a container',
             function(container) {
               var containerState = container.getState();
               if(containerState === CONTAINERSTATE.created || containerState === CONTAINERSTATE.exited) {
                 container.start(function startSuccess(successdata) { world.log(container.getState()); },
                                 onRequestError);
               } else {
                 world.logUsage('The start command only starts stopped containers.');
               }
             },
             'containercommand');

  addCommand('stop',
             'Stops a container',
             function(container) {
               if(container.getState() === CONTAINERSTATE.running) {
                 container.stop(function stopSuccess(successdata) { world.log(container.getState()); }, onRequestError);
               } else {
                 world.logUsage('The stop command can only stop a running container.');
               }
             },
             'containercommand');

  addCommand('go',
             'Takes player to a container, or to the first or last container',
             function goCommand(arguments) {
               var player = world.player();
               if(arguments.length > 1) {
                 var arg = arguments[1];
                 switch(arg) {
                 case 'home':
                   player.gohome();
                   break;
                 case 'nextslot':
                   player.gotonextslot();
                   break;
                 default:
                   player.moveToContainer(arg);
                   break;
                 }
               } else {
                 world.logUsage("Usage: go home or go nextslot or go <containername>");
               }
             },
             'generalcommand');

  addCommand('remove',
             'Deletes a container',
             function removeCommand(container) {

               var containerState = container.getState();
               if(containerState === CONTAINERSTATE.created || containerState === CONTAINERSTATE.exited) {
                 var containername = container.name();
                 world.apiClient.removecontainer(containername,
                                                 {},
                                                 function removeSuccess() {
                                                   world.containers.remove(containername);
                                                   world.log('Container ' + containername + ' removed.');
                                                 },
                                                 onRequestError);
               } else {
                 world.logUsage('Only stopped or freshly created containers can be removed.');
               }
             },
             'containercommand');

  addCommand(
      'create',
      'Creates a container',
      function createCommand(container) {

        world.apiClient.listimages(
            {},
            function createSuccess(success) {
              var dialog = world.dialog();
              dialog.iframe('createdialog.html', { "message" : 'init', data : success.data }, onCreateDialogMessage);
              dialog.open();

            },
            onRequestError);

        function onCreateDialogMessage(event)
        {
          var dialog = world.dialog();
          if(event.data.message === 'cancel') {
            dialog.close();
          } else if(event.data.message === 'create') {
            var createparams = event.data.data;
            world.apiClient.createcontainer(
                createparams, // { Image : 'debian', Tty : true, Cmd : ['/bin/bash'], name : 'Lovely_Chitra' }
                function onContainerCreate(success) {
                  dialog.close();
                  world.containers.add(createparams.name,
                                       { State : 'created', Image : createparams.Image, Command : createparams.Cmd })
                      .redraw();
                  world.log('Container ' + createparams.name + ' created.');
                },
                function onContainerCreateError(err) {
                  dialog.close();
                  onRequestError(err);
                });
          }
        }

      },
      'generalcommand');

  /** Add a command
   *  @method
   *  @param {string} name - Name of the command
   *  @param {string} description - One-line description of the command
   *  @param {function} action - The functionality of the command. Will get a container or argumets array as parameter
   *  @param {string} commandType - The type of command. 'containercommand' gets a container as parameter. All otheres
   * get an argument array.
   */
  this.add = addCommand;

  /** Remove a command
   *  @method
   *  @param {string} name - Name of the command to remove
   */
  this.remove = removeComand;

  /** Execute a command
   *  @method
   *  @param {string} name - Name of the command to executeCommand
   *  @param {any} arguments - Arguments to pass to a command. No checks are done at this point
   */
  this.execute = executeCommand;

  /** Get a command
   *  @method
   *  @param {string} name - Name of command to get
   */
  this.get = getCommand;
}

module.exports = commands;