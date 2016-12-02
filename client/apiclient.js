var axios = require('axios');

function apiclient(baseurl) {
    baseurl = baseurl ? baseurl : '';

    this.listcontainers = function (opts, successhandler, errorhandler) {
        opts = opts || { all: 1 };
        opts.all = opts.all || 1;

        axios.get(
            baseurl + '/containers/json',
            { params: opts }
        ).then(function (response) {
            successhandler.call(axios, response);
        }).catch(function (error) {
            errorhandler.call(axios, error);
        })
    }

    this.inspectcontainer = function (name, opts, successhandler, errorhandler) {
        opts = opts || {};

        axios.get(
            baseurl + '/containers/' + name + '/json',
            { params: opts }
        ).then(function (response) {
            successhandler.call(axios, response);
        }).catch(function (error) {
            errorhandler.call(axios, error);
        })
    }

    this.startcontainer = function (name, opts, successhandler, errorhandler) {
        opts = opts || {};

        axios.post(
            baseurl + '/containers/' + name + '/start',
            { params: opts }
        ).then(function (response) {
            successhandler.call(axios, response);
        }).catch(function (error) {
            errorhandler.call(axios, error);
        })

    }
}

module.exports = apiclient;