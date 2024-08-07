'use strict'

const ModalDialog = require('voxel-modal-dialog')

/** The modal dialog shown in voxel-dockerclient
 *  @constructor
 *  @param {world} world - The voxel-dockerclient world object
 */
function Dialog (world) {
  if (!this) {
    return new Dialog(world)
  }
  const self = this
  const opts = {}
  const box = document.createElement('div')
  box.className = 'docker-dialog-content'

  const headingsection = document.createElement('div')
  headingsection.className = 'headingsection'
  box.appendChild(headingsection)

  const headingelement = document.createElement('div')
  headingelement.className = 'heading'
  headingsection.appendChild(headingelement)

  const closebutton = document.createElement('div')
  closebutton.className = 'closebutton'
  closebutton.innerText = '✖'
  closebutton.onclick = function closeButtonClick (e) {
    self.close()
  }
  headingsection.appendChild(closebutton)

  const innerbox = document.createElement('div')
  innerbox.className = 'content'
  box.appendChild(innerbox)

  let frame
  let messageHandler

  opts.contents = [box]

  const modaldialog = new ModalDialog(world.game(), opts)

  function open () {
    modaldialog.open()
  }

  function close () {
    clean()
    modaldialog.close()
  }

  function heading (text) {
    if (text) {
      headingelement.innerText = text
    }
    return headingelement.innerText
  }

  function html (arg) {
    if (arg) {
      clean()
      innerbox.innerHTML = arg
      innerbox.classList.add('fill')
    }

    return innerbox.innerHTML
  }

  function iframe (src, initialmessage, messagehandler) {
    clean()

    frame = document.createElement('iframe')
    innerbox.appendChild(frame)

    frame.src = src
    messageHandler = messagehandler
    frame.onload = function onDialogIframeLoaded () {
      window.addEventListener('message', messageHandler, false)

      postMessage(initialmessage)
    }
  };

  function postMessage (message) {
    if (frame) {
      frame.contentWindow.postMessage(message, '*')
    }
  }

  function clean () {
    if (frame) {
      if (frame.parentElement) {
        frame.parentElement.removeChild(frame)
      }
      // delete frame;
      frame = undefined
      window.removeEventListener('message', messageHandler, false)
    }
    innerbox.innerHTML = ''
    innerbox.classList.remove('fill')
  }

  /** Opens the dialog
   *  @method
   */
  this.open = open

  /** Closes the dialog
   *  @method
   */
  this.close = close

  /** Sets of returns the heading of the dialog.
   *  @method
   *  @param {string} text - The text of the heading.
   *  @returns {string} - The text of the heading.
   */
  this.heading = heading

  /** Sets or returns the HTML shown in the dialog. Setting clears any prior content.
   *  @method
   *  @param {string} args - Valid HTML or text. If not passed, HTML will be returned.
   *  @returns {string} html - The existing contents of the dialog.
   */
  this.html = html

  /** Creates and loads an iframe inside the dialog. This clears any prior content.
   *  @method
   *  @param {string} src - The source of the iframe
   *  @param {object} initialmessage - The message to be sent to the iframe. Object - {message:'', data:{} }
   *  @param {function} messageHandler - The handler that will receive messages from the iframe
   */
  this.iframe = iframe

  /** Posts a message to the current iframe in the dialog, if any
   *  @method
   *  @param {object} message - The message to be sent to the iframe. Object - {message:'', data:{} }
   */
  this.postMessage = postMessage
}

module.exports = Dialog
