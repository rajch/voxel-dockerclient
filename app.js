var express = require('express');
var app = express();

// Read static files from public subdirectory
app.use(express.static('public'));

// Listen on port 8080 by default
app.listen(8080, function () {
  console.log('voxel-dcokerclient listening on port 8080.')
})