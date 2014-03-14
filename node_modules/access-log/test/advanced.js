var http = require('http');

var accesslog = require('../');

var host = '127.0.0.1';
var port = 9127;

var format = [
  'clfDate: :clfDate',
  'contentLength: :contentLength',
  'delta: :delta',
  'endDate: :endDate',
  'endTime: :endTime',
  'httpVersion: :httpVersion',
  'ip: :ip',
  'Xip: :Xip',
  'method: :method',
  'protocol: :protocol',
  'referer: :referer',
  'startDate: :startDate',
  'startTime: :startTime',
  'statusCode: :statusCode',
  'url: :url',
  'urlDecoded: :urlDecoded',
  'userID: :userID',
  'userAgent: :userAgent',
].join('\n');

http.createServer(onrequest).listen(port, host, started);

function onrequest(req, res) {
  accesslog(req, res, format);
  res.end();
}

function started() {
  console.log('server started');

  var req = http.request('http://localhost:9127/testing', function() {
    process.exit(0);
  });
  req.end();
}
