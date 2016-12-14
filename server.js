var express = require('express');
var morgan = require('morgan');
var app = express();

var Docker = require('dockerode');
var docker = new Docker();

// Log requests
app.use(morgan('dev'));

// Read static files from public subdirectory
app.use(express.static('public'));

function handleResponse(req, res)
{
  return function(err, result) {
    if(err) {
      res.end(res.writeHead(err.statusCode, err.reason));
    } else {
      res.json(result);
    }
  };
}

// docker ps
app.get('/containers/json',
        function(req, res) { docker.listContainers({ all : req.query['all'] }, handleResponse(req, res)); });

app.get('/images/json', function(req, res){ docker.listImages(handleResponse(req, res)) });

// docker inspect
app.get('/containers/:containername/json', function(req, res) {
  var ct = docker.getContainer(req.params['containername']);
  ct.inspect(handleResponse(req, res));
});

// docker top
app.get('/containers/:containername/top', function(req, res) {
  var ct = docker.getContainer(req.params['containername']);
  ct.top(handleResponse(req, res));
});

// docker logs
app.get('/containers/:containername/logs', function(req, res) {
  var ct = docker.getContainer(req.params['containername']);
  ct.logs({ stdout:true, stderr:false, follow:false}, handleResponse(req, res));
});

app.post('/containers/:containername/start', function(req, res) {
  var ct = docker.getContainer(req.params['containername']);
  ct.start(handleResponse(req, res));
});

app.post('/containers/:containername/stop', function(req, res) {
  var ct = docker.getContainer(req.params['containername']);
  ct.stop(handleResponse(req, res));
});

// Listen on port 8080 by default
app.listen(8080, function(){ console.log('voxel-dockerclient listening on port 8080.') })