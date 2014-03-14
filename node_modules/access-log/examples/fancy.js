var http = require('http');
var accesslog = require('../');

var format = 'url=":url" method=":method" statusCode=":statusCode" delta=":delta" ip=":ip"';

http.createServer(function(req, res) {
  accesslog(req, res, format, function(s) {
    console.log(s);
  });
  res.end();
}).listen(8000, 'localhost', function() {
  console.log('Listening on localhost:8000');
});
