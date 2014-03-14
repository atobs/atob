var http = require('http');

var accesslog = require('../');

var host = '127.0.0.1';
var port = 9127;

http.createServer(onrequest).listen(port, host, started);

function onrequest(req, res) {
  accesslog(req, res);
  res.end();
}

function started() {
  console.log('server started');

  var req = http.request('http://username@localhost:9127/testing', function() {
    process.exit(0);
  });
  req.end();
}
