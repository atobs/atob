var client_api = require_app("static/vendor/useractions");
var context = require_core("server/context");

var ua_parser = require("ua-parser");

var Sample = client_api.Sample;


var IP = require_app("models/ip");

var DECO = {
  browser_info: function(s, req) {
    if (typeof req === "undefined") {
      req = context("request");
    }

    if (!req) {
      return;
    }

    // Add in UA flavors
    var userAgent = req.headers["user-agent"];
    var ua = ua_parser.parseUA(userAgent);
    var os = ua_parser.parseOS(userAgent);

    s.string("browser_family", ua.family);
    s.string("browser_major", ua.major);
    s.string("browser_minor", ua.minor);

    s.string("os_family", os.family);

    var ip = req.ip;
    if (ip) {
      var hashed = IP.toHash(ip);
      s.string("ip", hashed);
    }

    return s;

  },
  server_info: "SERVER_INFO",
};

// Post it to the snorkel instance...
module.exports = { 
  Sample: Sample,
  decorate_sample: function(s, decorations, request) {
    if (!_.isArray(decorations)) {
      if (_.isFunction(decorations)) {
        decorations = [ decorations ];
      }
    }

    _.each(decorations, function(deco) {
      deco(s, request);
    });
  },
  DECO: DECO,
  handle_json_sample: function(json_obj, request) {
    var s = new Sample();

    s.data.integer = json_obj.integer || {};
    s.data.string = json_obj.string || {};
    s.data.set = json_obj.set || {};
  
    var ts = Date.now();
    if (s.__ts) {
      ts = +new Date(s.__ts);
    }

    s.integer("time", parseInt(ts / 1000, 10));

    s.dataset = json_obj.dataset;

    module.exports.decorate_sample(s, DECO.browser_info, request);


    _.each(s.data.integer, function(v, k) {
      s.data.integer[k] = parseInt(v, 10);
    });

    _.defer(function() {
      s.send();
    }, 1000);
    return s;
  },
}

function send_samples(dataset, samples) {

  var options = {
    hostname: 'localhost',
    port: 3000,
    path: '/data/import',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
  };

  var data = {
    dataset: 'atob',
    subset: dataset,
    samples: JSON.stringify(samples)
  };

  var http = require('http');

  var req = http.request(options, function(res) { });
  req.on('error', function(err) {
    console.log("ERROR", err);
  });

  req.write(JSON.stringify(data));
  req.end();
}

var queue_sample_send = _.throttle(function() {
  _.each(SAMPLES, function(samples, dataset) {
    send_samples(dataset, samples);
    SAMPLES[dataset] = [];
  });

}, 10000);

var SAMPLES = {};
Sample.__send = function(sample) {
  var sample_list = SAMPLES[sample.dataset];
  if (!sample_list) {
    SAMPLES[sample.dataset] = [];
    sample_list = SAMPLES[sample.dataset];
    delete sample.dataset;
  }

  sample_list.push(sample);
  queue_sample_send();
};
