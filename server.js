var express = require('express');
var morgan = require('morgan');
var app = express();

// Log requests
app.use(morgan('dev'));

// Read static files from public subdirectory
app.use(express.static('public'));

// Listen on port 8080 by default
app.listen(8080, function () {
  console.log('voxel-dockerclient listening on port 8080.')
})