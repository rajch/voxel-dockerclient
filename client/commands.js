var CONTAINERSTATE = require('./containerstate')

/** Voxel-Dockerclient commands
 *  @constructor
 *  @param {module:world~world} world
 */
function commands (world) {
  var commands = {}

  /** Voxel-Dockerclient command. 'this' evaluates to world in the action parameter
   *  @constructor
   */
  function Command (name, description, action, commandtype) {
    this.name = function () { return name }
    this.execute = function (args) { action.call(world, args) }
    this.description = description
    this.commandType = commandtype
  }

  function addCommand (name, description, action, commandType) {
    name = name.toLowerCase()
    var newCommand = new Command(name, description, action, commandType)
    commands[name] = newCommand
    return newCommand
  }

  function removeCommand (name) {
    name = name.toLowerCase()
    delete commands[name]
  }

  function executeCommand (name, args) {
    name = name.toLowerCase()
    commands[name].execute(args)
  }

  function getCommand (name) {
    name = name.toLowerCase()
    return commands[name]
  }

  function onRequestError (errordata) {
    if (errordata && errordata.response && errordata.response.statusText) {
      world.logError('Error:' + errordata.response.statusText)
    } else {
      world.logError('Error:' + errordata)
    }
  }

  // Set up built-in commands
  addCommand('help',
             'Shows all available commands',
             function helpCommand (args) {
               var helpHeader = [ 'Command', 'Description' ]
               var helpBody = []
               for (var cn in commands) {
                 helpBody.push([ cn, commands[cn].description ])
               }
               var dialog = world.dialog()
               dialog.heading('Available commands')
               dialog.html(world.tablify({ header: helpHeader, body: helpBody }))
               dialog.open()
             },
             'generalcommand')

  addCommand('inspect',
             'Inspects a container',
             function inpectCommand (container) {
               container.inspect(function inspectSuccess (success) {
                 var dialog = world.dialog()
                 dialog.heading('Inspecting ' + container.name())
                 dialog.html('<pre>' + JSON.stringify(success.data, null, '\t') + '</pre>')
                 dialog.open()
               }, onRequestError)
             },
             'containercommand')

  addCommand('top',
             'Shows processes running in a container',
             function topCommand (container) {
               var containerState = container.getState()
               if (containerState === CONTAINERSTATE.running || containerState === CONTAINERSTATE.paused) {
                 container.top(function topSuccess (success) {
                   var dialog = world.dialog()
                   dialog.heading('Processes running in ' + container.name())
                   dialog.html(world.tablify({ header: success.data.Titles, body: success.data.Processes }))
                   dialog.open()
                 }, onRequestError)
               } else {
                 world.logUsage('The top command only works with running containers.')
               }
             },
             'containercommand')

  addCommand('logs',
             'Shows container logs',
             function logsCommand (container) {
               var dialog = world.dialog()
               dialog.heading('Showing logs of ' + container.name())
               dialog.html('No logs yet.')
               dialog.open()

               world.apiClient.logscontainer(
                   container.name(),
                   {},
                   function () {},
                   function () {},
                   function onLogsProgress (event) { dialog.html(formatResponse(event.currentTarget.responseText)) })

               function formatResponse (respText) {
                 var respArray = respText.split('\n')
                 var formattedArray = respArray.map(function formatter (index) {
                   var firstchar = index.charCodeAt(0)
                   var result = index.substring(2)
                   if (firstchar === 1) {
                     result = '<div class="stdout">STDOUT:' + result + '</div>'
                   } else if (firstchar === 2) {
                     result = '<div class="stdout">STDERR:' + result + '</div>'
                   }
                   return result
                 })
                 return (formattedArray.join(''))
               }
             },
             'containercommand')

  addCommand('attach',
             'Attaches to a container',
             function attachCommand (container) {
               var dialog = world.dialog()

               dialog.heading('Attaching to ' + container.name())
               dialog.iframe(
                   'terminaldialog.html', { 'message': 'init', data: container.name() }, onAttachDialogMessage)
               dialog.open()

               function onAttachDialogMessage (event) {
                 if (event.data.message === 'cancel') {
                   dialog.close()
                 }
               }
             },
             'containercommand')

  addCommand('start',
             'Starts a container',
             function (container) {
               var containerState = container.getState()
               if (containerState === CONTAINERSTATE.created || containerState === CONTAINERSTATE.exited) {
                 container.start(function startSuccess (successdata) { world.log(container.getState()) },
                                 onRequestError)
               } else {
                 world.logUsage('The start command only starts stopped containers.')
               }
             },
             'containercommand')

  addCommand('stop',
             'Stops a container',
             function (container) {
               if (container.getState() === CONTAINERSTATE.running) {
                 container.stop(function stopSuccess (successdata) { world.log(container.getState()) }, onRequestError)
               } else {
                 world.logUsage('The stop command can only stop a running container.')
               }
             },
             'containercommand')

  addCommand('go',
             'Takes player to a container, or to the first or last container. Type go home if you get lost.',
             function goCommand (args) {
               var player = world.player()
               if (args.length > 1) {
                 var arg = args[1]
                 switch (arg) {
                   case 'home':
                     player.gohome()
                     break
                   case 'nextslot':
                     player.gotonextslot()
                     break
                   default:
                     player.moveToContainer(arg)
                     break
                 }
               } else {
                 world.logUsage('Usage: go home or go nextslot or go <containername>')
               }
             },
             'generalcommand')

  addCommand('remove',
             'Deletes a container',
             function removeCommand (container) {
               var containerState = container.getState()
               if (containerState === CONTAINERSTATE.created || containerState === CONTAINERSTATE.exited) {
                 var containername = container.name()
                 world.apiClient.removecontainer(containername,
                                                 {},
                                                 function removeSuccess () {
                                                   world.containers.remove(containername)
                                                   world.log('Container ' + containername + ' removed.')
                                                 },
                                                 onRequestError)
               } else {
                 world.logUsage('Only stopped or freshly created containers can be removed.')
               }
             },
             'containercommand')

  addCommand(
      'create',
      'Creates a container',
      function createCommand (container) {
        var dialog = world.dialog()

        world.apiClient.listimages(
            {},
            function createSuccess (success) {
              var dialog = world.dialog()
              dialog.heading('Create a new container')
              dialog.iframe('createdialog.html', { 'message': 'init', data: success.data }, onCreateDialogMessage)
              dialog.open()
            },
            onRequestError)

        function onCreateDialogMessage (event) {
          if (event.data.message === 'cancel') {
            dialog.close()
          } else if (event.data.message === 'verifyname') {
            verifynameavailable(event.data.name)
          } else if (event.data.message === 'create') {
            var createparams = event.data.data
            if (verifynameavailable(createparams.name)) {
              // Sanitize command
              if (createparams.Cmd === '') {
                // Do not pass empty command
                delete createparams.Cmd
              } else {
                // Command should be a whitespace-split Go array.
                createparams.Cmd = createparams.Cmd.split(' ')
              }
              // Sanitize tty
              if (createparams.Tty) {
                createparams.AttachStdin = true
                createparams.AttachStdout = true
                createparams.AttachStderr = true
                createparams.OpenStdin = true
                createparams.StdinOnce = true
              }
              world.apiClient.createcontainer(
                  createparams.name,
                  createparams, // { Image : 'debian', Tty : true, Cmd : ['/bin/bash'], name : 'Lovely_Chitra' }
                  function onContainerCreate (success) {
                    dialog.close()
                    world.containers.add(createparams.name,
                                         { State: 'created', Image: createparams.Image, Command: createparams.Cmd })
                        .redraw()
                    world.log('Container ' + createparams.name + ' created.')
                  },
                  function onContainerCreateError (err) {
                    dialog.close()
                    onRequestError(err)
                  })
            }
          }
        }

        function verifynameavailable (name) {
          var result = true
          if (world.containers.getContainer(name)) {
            dialog.postMessage({ message: 'containerexists', data: { name: name } })
            result = false
          }
          return result
        }
      },
      'generalcommand')

  addCommand(
      'welcome',
      'Shows the welcome message',
      function welcomeCommand () {
        var dialog = world.dialog()
        dialog.heading('Welcome to voxel-dockerclient')
        var welcomecontent = {
          header: [ 'Use', 'To' ],
          body: [
            [ 'your mouse', 'look around' ],
            [ 'W,A,S,D keys', 'move in the four directions' ],
            [ 'space bar', 'jump. Tap twice to start flying. When flying, the space bar will take you higher.' ],
            [ 'shift key', 'come down when flying. When you hit the ground, you will start walking again.' ],
            [
              '` key (above Tab)',
              'open the command console. This will also close the console and any dialog, including this one.'
            ],
            [ 'R key', 'toggle between first-person and third-person views.' ],
            [ 'I key', 'to inspect the container in front of you. You have to stand right in front of a container.' ],
            [
              'Esc key',
              'remove focus from the window. You will have to click the window again for things to work. Try not to press Esc :)'
            ],
            [ '', "That's it. Have fun." ]
          ]
        }
        dialog.html(world.tablify(welcomecontent))
        dialog.open()
      },
      'generalcommand')

  addCommand(
      'refresh', 'Re-fetches container list', function refreshCommand (args) { world.refresh() }, 'generalcommand')

  addCommand('restart',
             'Restarts voxel-dockerclient. Use as a last resort.',
             function refreshCommand (args) { window.location.reload() },
             'generalcommand')

  addCommand('login',
             'Shows the login dialog',
             function loginCommand() {
              var dialog = world.dialog()

              dialog.heading('Log in')
              dialog.iframe(
                  'logindialog.html', { 'message': 'init', data: '' }, onLoginDialogMessage)
              dialog.open()

              function onLoginDialogMessage (event) {
                if (event.data.message === 'cancel') {
                  dialog.close()
                  
                  world.refresh()
                }
              }
             },
             'generalcommand')

  /** Add a command
   *  @method
   *  @param {string} name - Name of the command
   *  @param {string} description - One-line description of the command
   *  @param {function} action - The functionality of the command. Will get a container or argumets array as parameter
   *  @param {string} commandType - The type of command. 'containercommand' gets a container as parameter. All otheres
   * get an argument array.
   */
  this.add = addCommand

  /** Remove a command
   *  @method
   *  @param {string} name - Name of the command to remove
   */
  this.remove = removeCommand

  /** Execute a command
   *  @method
   *  @param {string} name - Name of the command to execute
   *  @param {any} arguments - Arguments to pass to a command. No checks are done at this point
   */
  this.execute = executeCommand

  /** Get a command
   *  @method
   *  @param {string} name - Name of command to get
   */
  this.get = getCommand
}

module.exports = commands
