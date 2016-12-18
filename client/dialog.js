var ModalDialog = require('voxel-modal-dialog');

function dockerdialog(world)
{
  var opts = {};
  var box = document.createElement('div');
  var frame;
  var messageHandler;

  box.setAttribute('class', 'docker-dialog-content');
  opts.contents = [box];

  var dialog = new ModalDialog(world.game(), opts);

  this.open = function(args) {
    if(typeof args === 'string') {
      box.innerHTML = args;
    }

    var parentElement = world.options().parentElement;
    var width = parentElement.clientWidth * 0.8;
    var height = parentElement.clientHeight * 0.8;

    box.style.width = width + "px";
    box.style.height = height + "px";

    dialog.open();
  };

  this.close = function() {
    clean();
    dialog.close();
  };

  this.html = function(arg) {
    if(arg) {
      box.innerHTML = arg;
    }

    return box.innerHTML;
  };

  this.iframe = function(src, initialmessage, messagehandler) {
    clean();
    

    frame = document.createElement('iframe');
    frame.style.width = '90%';
    frame.style.height = '90%';
    box.appendChild(frame);

    frame.src = src;
    messageHandler = messagehandler;
    frame.onload = function onDialogIframeLoaded() {
      window.addEventListener('message', messageHandler, false);

      frame.contentWindow.postMessage(initialmessage, '*');
    };

    return frame;
  };

  function clean()
  {
    if(frame) {
      if(frame.parentElement) {
        frame.parentElement.removeChild(frame);
      }
      delete frame;
      window.removeEventListener('message', messageHandler, false);
    }
    box.innerHTML = '';
  }
}

module.exports = dockerdialog;