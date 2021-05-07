const axios = require('axios')

function apiclient (baseurl) {
  baseurl = baseurl || ''

  function get (url, opts, successHandler, errorHandler, progressHandler) {
    opts = opts || {}

    const config = {}
    config.params = opts
    if (typeof progressHandler === 'function') {
      config.onDownloadProgress = progressHandler
    }

    axios.get(baseurl + url, config).then(function (response) { successHandler.call(axios, response) }).catch(
      function (error) { errorHandler.call(axios, error) })
  }

  function post (url, opts, successHandler, errorHandler) {
    opts = opts || {}

    axios.post(baseurl + url, opts).then(function (response) { successHandler.call(axios, response) }).catch(
      function (error) { errorHandler.call(axios, error) })
  }

  function deleteverb (url, opts, successHandler, errorHandler) {
    opts = opts || {}

    axios.delete(baseurl + url, opts).then(function (response) { successHandler.call(axios, response) }).catch(
      function (error) { errorHandler.call(axios, error) })
  }

  this.listcontainers = function (opts, successHandler, errorHandler) {
    opts = opts || { all: 1 }
    opts.all = opts.all || 1

    get('/containers/json', opts, successHandler, errorHandler)
  }

  this.createcontainer = function (name, opts, successHandler, errorHandler) {
    opts = opts || { image: 'debian', tty: true }

    post('/containers/create?name=' + name, opts, successHandler, errorHandler)
  }

  this.inspectcontainer = function (name, opts, successHandler, errorHandler) {
    opts = opts || {}

    get('/containers/' + name + '/json', opts, successHandler, errorHandler)
  }

  this.topcontainer = function (name, opts, successHandler, errorHandler) {
    opts = opts || {}

    get('/containers/' + name + '/top', opts, successHandler, errorHandler)
  }

  this.logscontainer = function (name, opts, successHandler, errorHandler, progressHandler) {
    opts = opts || {}
    opts.stdout = true
    opts.stderr = true

    get('/containers/' + name + '/logs', opts, successHandler, errorHandler, progressHandler)
  }

  this.startcontainer = function (name, opts, successHandler, errorHandler) {
    opts = opts || {}

    post('/containers/' + name + '/start', opts, successHandler, errorHandler)
  }

  this.stopcontainer = function (name, opts, successHandler, errorHandler) {
    opts = opts || {}

    post('/containers/' + name + '/stop', opts, successHandler, errorHandler)
  }

  this.removecontainer = function (name, opts, successHandler, errorHandler) {
    opts = opts || {}

    deleteverb('/containers/' + name, opts, successHandler, errorHandler)
  }

  this.listimages = function (opts, successHandler, errorHandler) {
    opts = opts || {}

    get('/images/json', opts, successHandler, errorHandler)
  }
}
module.exports = apiclient
