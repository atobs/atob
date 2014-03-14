var http = require('http');

var accesslog = require('../');

var host = '127.0.0.1';
var port = 9127;

var data = 'hello world';
var len = Buffer.byteLength(data, 'utf-8')

http.createServer(onrequest).listen(port, host, started);

function onrequest(req, res) {
  accesslog(req, res);
  res.writeHead(200, {'Content-Length': len});
  res.end(data);
}

function started() {
  console.log('server started');

  var req = http.request('http://localhost:9127/testing', function() {
    process.exit(0);
  });
  req.end();
}
