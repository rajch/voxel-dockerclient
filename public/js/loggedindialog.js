(function loggedindialog() {
    var sourceWindow = window.parent;

    function sendMessage(message) {
        if (sourceWindow) {
            sourceWindow.postMessage(message, window);
        }
    }
    // Nothing to do, here, except close the dialog box
    sendMessage({ message: 'cancel' })

})();