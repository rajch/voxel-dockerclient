var axios = require('axios');

function apiclient(baseurl) {
    baseurl = baseurl ? baseurl : '';

    this.listcontainers = function(opts, successhandler, errorhandler) {
        opts = opts || { all: 1} ;
        opts.all = opts.all || 1;
        
        axios.get(
            baseurl + '/containers/json',
            { params: opts }
        ).then(function(response){
            successhandler.call(axios, response);
        }).catch(function(error){
            errorhandler.call(axios, error);
        })
    }
}

module.exports = apiclient;