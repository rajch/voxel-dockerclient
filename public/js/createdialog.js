(function createdialog () {
  let sourceWindow
  let eventOrigin

  window.addEventListener('message', onMessageReceived, false)

  const submitbutton = document.getElementById('submitbutton')
  const cancelbutton = document.getElementById('resetbutton')
  const inputcontainername = document.getElementById('containername')

  submitbutton.addEventListener('click', onSubmit)
  cancelbutton.addEventListener('click', onReset)

  function onMessageReceived (event) {
    sourceWindow = event.source
    eventOrigin = event.origin

    if (event.data.message === 'init') {
      // Game will send us image details
      const imagelist = event.data.data
      const imageselector = document.getElementById('dockerimage')

      for (let i = 0; i < imagelist.length; i++) {
        const opt = document.createElement('option')
        opt.text = imagelist[i].RepoTags[0]
        // opt.value = imagelist[i].Id;
        imageselector.add(opt)
      }
    } else if (event.data.message === 'containerexists') {
      inputcontainername.classList.add('error')
      document.getElementById('nameerror').classList.remove('invisible')
    }
  }

  function onSubmit (event) {
    const createMessage = { message: 'create', data: {} }
    createMessage.data.name = inputcontainername.value
    createMessage.data.Tty = document.getElementById('containerinteractive').checked
    createMessage.data.Image = document.getElementById('dockerimage').value
    createMessage.data.Cmd = document.getElementById('containercmd').value

    sendMessage(createMessage)

    event.preventDefault()
  }

  function onReset (event) {
    sendMessage({ message: 'cancel' })
    event.preventDefault()
  }

  function sendMessage (message) {
    if (sourceWindow) {
      sourceWindow.postMessage(message, eventOrigin)
    }
  }
})()
