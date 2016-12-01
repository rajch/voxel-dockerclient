var express = require('express');
var morgan = require('morgan');
var app = express();

var Docker = require('dockerode');
var docker = new Docker();

// Log requests
app.use(morgan('dev'));

// Read static files from public subdirectory
app.use(express.static('public'));


app.get('/containers/json', function (req, res) {
  docker.listContainers({ all: req.query['all'] }, function (err, containers) {
    res.json(containers);
  });
});

app.get('/images/json', function (req, res) {
  docker.listImages(function (err, images) {
    res.json(images);
  });
});

app.get('/containers/:containername/json', function(req, res) {
  var ct = docker.getContainer(req.params['containername']);
  ct.inspect(function(err, inspectdata){
    res.json(inspectdata);
  });
});


// Listen on port 8080 by default
app.listen(8080, function () {
  console.log('voxel-dockerclient listening on port 8080.')
});