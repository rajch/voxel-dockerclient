(function terminaldialog () {
  let sourceWindow
  let eventOrigin

  let socket
  let terminal

  let errorcreated

  window.addEventListener('message', onMessageReceived, false)

  function onMessageReceived (event) {
    sourceWindow = event.source
    eventOrigin = event.origin

    if (event.data.message === 'init') {
      if (!window.WebSocket) {
        // Websocket support not present.
      } else {
        // Game will send us container name
        const containername = event.data.data

        terminal = new Terminal({
          cols: 80,
          rows: 26
        })

        const fitaddon = new FitAddon.FitAddon()

        terminal.open(document.getElementById('terminal-container'))
        terminal.loadAddon(fitaddon)
        fitaddon.fit()

        const wsUri = 'ws://' + window.location.host + '/websocket/containers/' + containername +
          '/attach/ws?logs=0&stderr=1&stdout=1&stream=1&stdin=1'

        socket = new WebSocket(wsUri)
        socket.binaryType = 'arraybuffer'

        socket.onopen = function onOpen (evt) {
          terminal.writeln("Session started. If you don't see a prompt, press enter or/and Ctrl+L")
        }

        socket.onclose = function onClose (evt) {
          terminal.writeln('Session terminated')
          if (!errorcreated) { sendMessage({ message: 'cancel' }) }
        }

        socket.onmessage = function onMessage (evt) {
          if (evt.data instanceof ArrayBuffer) {
            const binarydata = new Uint8Array(evt.data)
            terminal.write(binarydata)
          } else {
            terminal.write(evt.data)
          }
        }

        socket.onerror = function onError (evt) {
          terminal.writeln('ERROR:' + JSON.stringify(evt))
          errorcreated = true
        }

        terminal.onData(function terminalOnData (data) {
          socket.send(data)
        })

        terminal.focus()
      }
    }
  }

  function sendMessage (message) {
    if (sourceWindow) {
      sourceWindow.postMessage(message, eventOrigin)
    }
  }
})()
