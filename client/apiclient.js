var axios = require('axios');

function apiclient(baseurl)
{
    baseurl = baseurl ? baseurl : '';

    function get(url, opts, successHandler, errorHandler)
    {
        opts = opts || {};

        axios.get(baseurl + url, { params : opts }).then(function(response) {
            successHandler.call(axios, response);
        }).catch(function(error) { errorHandler.call(axios, error); })
    }

    function post(url, opts, successHandler, errorHandler)
    {
        opts = opts || {};

        axios.post(baseurl + url, { params : opts }).then(function(response) {
            successHandler.call(axios, response);
        }).catch(function(error) { errorHandler.call(axios, error); })
    }

    this.listcontainers = function(opts, successHandler, errorHandler) {
        opts = opts || { all : 1 };
        opts.all = opts.all || 1;

        get('/containers/json', opts, successHandler, errorHandler);
    };

    this.inspectcontainer = function(name, opts, successHandler, errorHandler) {
        opts = opts || {};

        get('/containers/' + name + '/json', opts, successHandler, errorHandler);
    };

    this.startcontainer = function(name, opts, successHandler, errorHandler) {
        opts = opts || {};

        post('/containers/' + name + '/start', opts, successHandler, errorHandler);
    };

    this.stopcontainer = function(name, opts, successHandler, errorHandler) {
        opts = opts || {};

        post('/containers/' + name + '/stop', opts, successHandler, errorHandler);
    };
}

module.exports = apiclient;