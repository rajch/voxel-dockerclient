var sourceWindow;
var eventOrigin;
var submitbutton;
var cancelbutton;

window.addEventListener('message', onMessageReceived, false);

submitbutton = document.getElementById('submitbutton');
cancelbutton = document.getElementById('resetbutton');

submitbutton.addEventListener('click', onSubmit);
cancelbutton.addEventListener('click', onReset);

function onMessageReceived(event)
{
  sourceWindow = event.source;
  eventOrigin = event.origin;

  if(event.data.message === 'init') {
    // Game will send us image details
    var imagelist = event.data.data;
    var imageselector = document.getElementById('dockerimage');

    for(var i = 0; i < imagelist.length; i++) {
      var opt = document.createElement('option');
      opt.text = imagelist[i].RepoTags[0];
      //opt.value = imagelist[i].Id;
      imageselector.add(opt);
    }
  }
}

function onSubmit(event)
{
  var createMessage = { message:'create', data: {} };
  createMessage.data.name = document.getElementById('containername').value;
  createMessage.data.Tty = document.getElementById('containerinteractive').checked;
  createMessage.data.Image = document.getElementById('dockerimage').value;
  createMessage.data.Cmd = document.getElementById('containercmd').value;
  
  sendMessage(createMessage);
  
  event.preventDefault();
}

function onReset()
{
  sendMessage({ message : 'cancel' });
}

function sendMessage(message)
{
  if(sourceWindow) {
    // Send info back
    sourceWindow.postMessage(message, eventOrigin);
  }
}