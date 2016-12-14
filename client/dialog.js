var ModalDialog = require('voxel-modal-dialog');

function dockerdialog(world)
{
  var opts = {};
  var box = document.createElement('div');

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

  this.close = dialog.close;

  this.html = function(arg) {
    if(arg) {
      box.innerHTML = arg;
    }

    return box.innerHTML;
  };
}

module.exports = dockerdialog;