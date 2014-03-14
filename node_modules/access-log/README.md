access-log
==========

Add simple access logs to any http or https server

Usage
-----

``` js
var http = require('http');
var accesslog = require('access-log');

http.createServer(function(req, res) {
  accesslog(req, res);
  res.end();
}).listen(80, '0.0.0.0');
```

This will automatically log requests as they come in to the
web server that look like...

```
127.0.0.1 - - [13/Sep/2013:01:38:09 -0400] "GET / HTTP/1.1" 200 - "-" "-"
127.0.0.1 - - [13/Sep/2013:01:38:09 -0400] "GET /testing HTTP/1.1" 200 - "-" "-"
127.0.0.1 - - [13/Sep/2013:01:38:10 -0400] "GET /index.html HTTP/1.1" 200 - "-" "-"
```

Customization
-------------

### accesslog(req, res, [format], [function])

#### format

You can pass in a format string, the default is Apache Common Log Format
http://en.wikipedia.org/wiki/Common_Log_Format

```
:ip - :userID [:clfDate] ":method :url :protocol/:httpVersion" :statusCode :contentLength ":referer" ":userAgent"
```

- `clfDate`: The date of the end of the response in Apache Common Log format
- `contentLength`: The response `Content-Length` header, or `-` if unset
- `delta`: The time in ms from request to response
- `endDate`: The ISO formatted string when the response was ended
- `endTime`: The epoch time when the response was ended
- `httpVersion`: The HTTP version used (ie. `1.0`, `1.1`)
- `ip`: The remote IP
- `Xip`: The remote IP, using `X-Forwarded-For` if set
- `method`: The HTTP method
- `protocol`: `HTTP` or `HTTPS`
- `referer`: The request `Referer` header, or `-` if unset
- `startDate`: The ISO formatted string when the request was received
- `startTime`: The epoch time when the request was received
- `statusCode`: The response status code sent from the server
- `url`: The requested URL
- `urlDecoded`: The decoded request URL (ie. `%20` => ` `)
- `userID`: The username if applicable
- `userAgent`: The request `User-Agent` header, or `-` if unset

**NOTE:** Wrap variables in `{}` to protect against unwanted interpolation.

ex:

```
request to :url took :{delta}ms
```

#### function

You can also pass in your own custom callback, the default is `console.log`.
The only argument passed is the access log string

Example
-------

``` js
var format = 'url=":url" method=":method" statusCode=":statusCode" delta=":delta" ip=":ip"';

accesslog(req, res, format, function(s) {
  console.log(s);
});
```

yields

```
url="/projects" method="GET" statusCode="200" delta="0" ip="127.0.0.1"
url="/testing" method="GET" statusCode="200" delta="1" ip="127.0.0.1"
url="/index.html" method="GET" statusCode="200" delta="0" ip="127.0.0.1"
```

Installation
------------

    npm install access-log

Extend
------

Consider further customizing the access logs by using the [log-timestamp]
(https://github.com/bahamas10/node-log-timestamp) module to prepend a timestamp
automatically.

License
-------

MIT Licensed
