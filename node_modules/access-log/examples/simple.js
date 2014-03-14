var http = require('http');
var accesslog = require('../');

http.createServer(function(req, res) {
  accesslog(req, res);
  res.end();
}).listen(8000, 'localhost', function() {
  console.log('Listening on localhost:8000');
});
