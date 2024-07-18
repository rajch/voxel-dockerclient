"use strict"

function apiclient (baseurl) {
  baseurl = baseurl || ''

  function request (url, method, opts, successHandler, errorHandler) {
    let requesturl = baseurl + url

    const requestopts = {
      method
    }

    if (opts) {
      if (method === 'GET') {
        // GET calls should pass options in query string parameters
        requesturl = requesturl + '?' + new URLSearchParams(opts).toString()
      } else {
        // All other verbs carry a JSON payload in the request body
        requestopts.headers = { 'Content-type': 'application/json' }
        requestopts.body = JSON.stringify(opts)
      }
    }

    fetch(requesturl, requestopts)
      .then(function (response) {
        // Replicate axios behaviour of a non-ok response being an error
        if (!response.ok) {
          const errorvalue = new Error('Error status returned:' + response.status)
          errorvalue.response = response
          throw errorvalue
        } else {
          // Only .text() is okay with an empty response. Later, we will parse it
          // into valid json.
          // This is a promise, so gets taken care of in the next .then
          return response.text()
        }
      })
      .then(function (responseData) {
        // Replicate axios behaviour of response body being sent back in
        // data property
        const responseBody = responseData ? { data: JSON.parse(responseData) } : {}
        successHandler(responseBody)
      })
      .catch(function (error) {
        errorHandler(error)
      })
  }

  function get (url, opts, successHandler, errorHandler, progressHandler) {
    request(url, 'GET', opts, successHandler, errorHandler)
  }

  function post (url, opts, successHandler, errorHandler) {
    request(url, 'POST', opts, successHandler, errorHandler)
  }

  function deleteverb (url, opts, successHandler, errorHandler) {
    request(url, 'DELETE', opts, successHandler, errorHandler)
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
