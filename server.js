var express = require('express');
var morgan = require('morgan');
var app = express();

var Docker = require('dockerode');
var docker = new Docker();

// Log requests
app.use(morgan('dev'));

// Read static files from public subdirectory
app.use(express.static('public'));


app.get('/containers/json', function(req, res){
  docker.listContainers(function(err,containers){
    res.json(containers);
  });
});

app.get('/images/json', function(req, res){
  docker.listImages(function(err,images){
    res.json(images);
  });
});


// Listen on port 8080 by default
app.listen(8080, function () {
  console.log('voxel-dockerclient listening on port 8080.')
})