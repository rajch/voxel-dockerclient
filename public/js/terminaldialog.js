(function terminaldialog() {
  var sourceWindow;
  var eventOrigin;

  var socket;
  var terminal;

  var errorcreated;

  window.addEventListener('message', onMessageReceived, false);

  function onMessageReceived(event) {
    sourceWindow = event.source;
    eventOrigin = event.origin;

    if (event.data.message === 'init') {
      if (!window.WebSocket) {
        // Websocket support not present.
      } else {
        // Game will send us container name
        var containername = event.data.data;

        terminal = new Terminal({
          cols: 80, 
          rows: 26
        });
        terminal.open(document.getElementById('terminal-container'));

        var wsUri = "ws://" + window.location.host + "/websocket/containers/" + containername +
          "/attach/ws?logs=0&stderr=1&stdout=1&stream=1&stdin=1";

        socket = new WebSocket(wsUri);
        socket.binaryType = "arraybuffer"


        socket.onopen = function onOpen(evt) {
          terminal.writeln("Session started. If you don't see a prompt, press enter or/and Ctrl+L");
        };

        socket.onclose = function onClose(evt) {
          terminal.writeln("Session terminated");
          if (!errorcreated)
            sendMessage({ message: 'cancel' });
        };

        function ab2str(buf) {
          return String.fromCharCode.apply(null, new Uint8Array(buf));
        }

        socket.onmessage = function onMessage(evt) {
          if (evt.data instanceof ArrayBuffer) {
            terminal.write(ab2str(evt.data))
          } else {
            terminal.write(evt.data);
          }
        };

        socket.onerror = function onError(evt) {
          terminal.writeln('ERROR:' + JSON.stringify(evt));
          errorcreated = true;
        };

        terminal.on('data', function (data) {
          socket.send(data);
        });
        
      }
    }
  }

  function sendMessage(message) {
    if (sourceWindow) {
      sourceWindow.postMessage(message, eventOrigin);
    }
  }
})();