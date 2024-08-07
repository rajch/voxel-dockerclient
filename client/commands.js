const CONTAINERSTATE = require('./containerstate')

/** Voxel-Dockerclient commands
 *  @constructor
 *  @param {module:world~world} world
 */
function commands (world) {
  const commands = {}

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
    const newCommand = new Command(name, description, action, commandType)
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
    if (errordata && errordata.response) {
      if (errordata.response.status === 401) {
        // Unauthorized
        executeCommand('login')
      } else {
        world.logError('Error:' + errordata.response.statusText)
      }
    } else {
      world.logError('Error:' + errordata)
    }
  }

  // Set up built-in commands
  addCommand('help',
    'Shows all available commands',
    function helpCommand (args) {
      const helpHeader = ['Command', 'Description']
      const helpBody = []
      for (const cn in commands) {
        helpBody.push([cn, commands[cn].description])
      }
      const dialog = world.dialog()
      dialog.heading('Available commands')
      dialog.html(world.tablify({ header: helpHeader, body: helpBody }))
      dialog.open()
    },
    'generalcommand')

  addCommand('inspect',
    'Inspects a container',
    function inpectCommand (container) {
      container.inspect(function inspectSuccess (success) {
        const dialog = world.dialog()
        dialog.heading('Inspecting ' + container.name())
        dialog.html('<pre>' + JSON.stringify(success.data, null, '\t') + '</pre>')
        dialog.open()
      }, onRequestError)
    },
    'containercommand')

  addCommand('top',
    'Shows processes running in a container',
    function topCommand (container) {
      const containerState = container.getState()
      if (containerState === CONTAINERSTATE.running || containerState === CONTAINERSTATE.paused) {
        container.top(function topSuccess (success) {
          const dialog = world.dialog()
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
      const dialog = world.dialog()
      dialog.heading('Showing logs of ' + container.name())
      dialog.html('No logs yet.')
      dialog.open()

      world.apiClient.logscontainer(
        container.name(),
        {},
        function onLogsSuccess (success) {
          if (success && (success.data instanceof ArrayBuffer)) {
            const logdata = processLogdata(success.data)
            dialog.html(logdata)
          } else {
            dialog.html('Could not fetch logs.')
          }
        },
        onRequestError
      )

      function processLogdata (databuffer) {
        // This function processes a Docker container log retrieved
        // via the API, as described in the following article:
        // https://ahmet.im/blog/docker-logs-api-binary-format-explained/
        // Many thanks to the author.
        const byteArray = new Uint8Array(databuffer)
        const records = []
        const decoder = new TextDecoder()

        let currentIndex = 0
        while (currentIndex < byteArray.length) {
          // Read the header
          // First byte contains record type. 1 is STDOUT, 2 is STDERR
          const type = byteArray[currentIndex]
          // Fifth through eightth bytes contain big-ending integer
          // which is the length of the message
          const recordLength = (byteArray[currentIndex + 4] << 24) |
            (byteArray[currentIndex + 5] << 16) |
            (byteArray[currentIndex + 6] << 8) |
            byteArray[currentIndex + 7]

          if (recordLength > 0) {
            // Extract the message
            const messageBytes = byteArray.slice(currentIndex + 8, currentIndex + 8 + recordLength)

            const message = decoder.decode(messageBytes)
            const newelement = document.createElement('div')
            newelement.setAttribute('data-type', type)
            newelement.classList.add('logmessage')
            newelement.innerText = message
            const record = newelement.outerHTML
            records.push(record)
          }

          // Move to the next record
          currentIndex += 8 + recordLength
        }

        return records.join('')
      }
    },
    'containercommand')

  addCommand('attach',
    'Attaches to a container',
    function attachCommand (container) {
      const dialog = world.dialog()

      dialog.heading('Attaching to ' + container.name())
      dialog.iframe(
        'terminaldialog.html', { message: 'init', data: container.name() }, onAttachDialogMessage)
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
      const containerState = container.getState()
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
      const player = world.player()
      if (args.length > 1) {
        const arg = args[1]
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
      const containerState = container.getState()
      if (containerState === CONTAINERSTATE.created || containerState === CONTAINERSTATE.exited) {
        const containername = container.name()
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
      const dialog = world.dialog()

      world.apiClient.listimages(
        {},
        function createSuccess (success) {
          const dialog = world.dialog()
          dialog.heading('Create a new container')
          dialog.iframe('createdialog.html', { message: 'init', data: success.data }, onCreateDialogMessage)
          dialog.open()
        },
        onRequestError)

      function onCreateDialogMessage (event) {
        if (event.data.message === 'cancel') {
          dialog.close()
        } else if (event.data.message === 'verifyname') {
          verifynameavailable(event.data.name)
        } else if (event.data.message === 'create') {
          const createparams = event.data.data
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
        let result = true
        if (world.containers.getContainer(name)) {
          dialog.postMessage({ message: 'containerexists', data: { name } })
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
      const dialog = world.dialog()
      dialog.heading('Welcome to voxel-dockerclient')
      const welcomecontent = {
        header: ['Use', 'To'],
        body: [
          ['your mouse', 'look around'],
          ['W,A,S,D keys', 'move in the four directions'],
          ['space bar', 'jump. Tap twice to start flying. When flying, the space bar will take you higher.'],
          ['shift key', 'come down when flying. When you hit the ground, you will start walking again.'],
          [
            '` key (above Tab)',
            'open the command console. This will also close the console and any dialog, including this one.'
          ],
          ['R key', 'toggle between first-person and third-person views.'],
          ['I key', 'to inspect the container in front of you. You have to stand right in front of a container.'],
          ['L key', 'to see the logs of the container in front of you. You have to stand right in front of a container.'],
          [
            'Esc key',
            'remove focus from the window. You will have to click the window again for things to work. Try not to press Esc :)'
          ],
          ['', "That's it. Have fun."]
        ]
      }
      dialog.html(world.tablify(welcomecontent))
      dialog.open()
    },
    'generalcommand')

  addCommand('refresh',
    'Re-fetches container list',
    function refreshCommand (args) {
      world.refresh(
        function refreshSuccess () {
          world.log('Container list refreshed.')
        },
        onRequestError
      )
    },
    'generalcommand')

  addCommand('restart',
    'Restarts voxel-dockerclient. Use as a last resort.',
    function restartCommand (args) { window.location.reload() },
    'generalcommand')

  addCommand('login',
    'Shows the login dialog',
    function loginCommand (arg) {
      const dialog = world.dialog()

      dialog.heading('Log in')
      dialog.iframe(
        '/signin', { message: 'init', data: '' }, onLoginDialogMessage)
      dialog.open()

      function onLoginDialogMessage (event) {
        if (event.data.message === 'cancel') {
          dialog.close()

          world.refresh(
            function loginRefreshSuccess () {
              world.log('Log in successful.')

              if (arg === 'start') {
                world.log('Type help and press enter to see available commands.')
                executeCommand('welcome')
              }
            },
            onRequestError
          )
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
