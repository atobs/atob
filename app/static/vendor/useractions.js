(function() {

  // {{{ BROWSER EVENT HELPER
  function addEvent(listener, evt, cb) {
    if (document.addEventListener) {
      listener.addEventListener(evt, cb);
    } else if (document.attachEvent) {
      listener.attachEvent("on"+evt, cb);
    }
  }
  // }}}

  // {{{ SAMPLE API
  // override Sample.__send to use this instrumentation to its fullest!
  var Sample = function(dataset) {
    var dict = { integer: {}, set: {}, string: {} };

    var obj = {
      dataset: dataset,
      meta: {
        dataset: dataset,
      },
      integer: function(k, v) {
        dict.integer[k] = v;
        return obj;
      },
      string: function(k, v) {
        dict.string[k] = v;
        return obj;
      },
      send: function() {
        if (dict.__sent) {
          console.log("Trying to double send sample");
          return;
        }

        var copy = {};
        dict.__sent = true;
        var fields = [ "integer", "string" ];
        for (var f = 0; f < fields.length; f++) {
          var inner = dict[fields[f]];
          var keys = Object.keys(inner);
          if (dict[fields[f]] && keys.length > 0) {
            var inner_copy = {};
            for (var i = 0; i < keys.length; i++) {
              // only copy non falsey values
              if (inner[keys[i]]) {
                inner_copy[keys[i]] = inner[keys[i]];
              }
            }
            copy[fields[f]] = inner_copy;
          }
        }

        if (!copy.__ts) {
          copy.__ts = obj.__ts || obj.meta.ts;
        }

        if (!copy.dataset) {
          copy.dataset = obj.dataset;
        }

        Sample.__send(copy, obj.meta);
      },
      data: dict,
    };

    return obj;
  };

  Sample.__send = function(s, meta) {
    console.log("Sending Sample", JSON.stringify(s), "with metadata", meta);
  };

  // }}} SAMPLE API

  // {{{ INSTRUMENTATION APIS
  // {{{ UserActions (click tracking)
  var UserActions = {
    // pulls data off DOM nodes for click tracking
    collect_data_from_nodes: function(target) {
      var  specList = "", firstSpec = "";
      var curNode = target;
      var href = "";
      var closest_id = "";

      while (curNode && curNode !== window.document.body) {
        var nodeName = curNode.nodeName.toLowerCase();
        var div_name = nodeName;
        if (curNode.href) {
          href = curNode.href;
        }

        if (curNode.id) {
          div_name += "#" + curNode.id;

          if (!closest_id) {
            closest_id = curNode.id;
          }
        }

        if (curNode.className) {
          div_name += "." + curNode.className;
        }

        if (div_name !== curNode.nodeName) {
          specList = div_name + ">" + specList;
        }

        if (!firstSpec) {
          firstSpec = div_name;
        }

        curNode = curNode.parentNode;
      }

      return {
        path: firstSpec,
        fullpath: specList,
        href: href,
        closest_id: closest_id
      };
    },

    handle_click: function(evt) {
      if (evt.__handled) {
        return;
      }

      evt.__handled = true;

      var sample = new Sample("useractions");
      var data = UserActions.collect_data_from_nodes(evt.target);

      sample
        .string("action", "click")
        .string("node", data.path)
        .string("fullpath", data.fullpath)
        .string("closest_id", data.closest_id)
        .string("href", data.href)
        .string("page", CURRENT_URL)
        .integer("w", window.innerWidth)
        .integer("h", window.innerHeight)
        .integer("cx", evt.clientX)
        .integer("cy", evt.clientY)
        .integer("px", evt.pageX)
        .integer("py", evt.pageY)
        .send();
    },

    init: function() {
      if (window.jQuery) {
        $(function() {
          // The delegate portion is so we can track clicks that are event stop propagated
          $("body").delegate("*", "click", UserActions.handle_click);
        });
      } else {
        addEvent(document, "click", UserActions.handle_click);
      }
    }
  };
  // }}} UserActions

  // {{{ TimeSpent
  var IDLE_TIMER = 0;
  // Allocates time spent proportional to the time spent in various contexts on the page
  var TimeSpent = {
    last_mouse_move: 0,
    handle_mousemove_or_keydown: function() {
      if (Date.now() - this.last_mouse_move < 100) {
        return;
      }

      IDLE_TIMER = 0;

      this.last_mouse_move = Date.now();


    },

    init: function() {
      var TIME_SPENT_URL;
      var TIME_SPENT_CTX;

      addEvent(document, "mousemove", TimeSpent.handle_mousemove_or_keydown);
      addEvent(document, "keydown", TimeSpent.handle_mousemove_or_keydown);


      // FROM MDN: https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
      // Set the name of the hidden property and the change event for visibility
      var hiddenProp, visibilityChange;
      if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
        hiddenProp = "hidden";
        visibilityChange = "visibilitychange";
      } else if (typeof document.mozHidden !== "undefined") {
        hiddenProp = "mozHidden";
        visibilityChange = "mozvisibilitychange";
      } else if (typeof document.msHidden !== "undefined") {
        hiddenProp = "msHidden";
        visibilityChange = "msvisibilitychange";
      } else if (typeof document.webkitHidden !== "undefined") {
        hiddenProp = "webkitHidden";
        visibilityChange = "webkitvisibilitychange";
      }
      // MDN Based code

      var unfocused = false;
      // STACK OVERFLOW: http://codereview.stackexchange.com/questions/123645/pagevisibility-api-to-handle-page-tab-visibility-changes/124122
      function onshow() { unfocused = false; }
      function onhide() { unfocused = true; }

      if ('onfocusin' in document) {
        document.onfocusin = onshow;
        document.onfocusout = onhide;
      } else {
        window.onpageshow = window.onfocus = onshow;
        window.onpagehide = window.onblur = onhide;
      }

      // End SO based code



      var time_spent_packets = {};
      var session_size = 60;

      function get_time_spent_sample(page, context) {
        context = context || "*";
        var packet_key = page + ":" + context;

        var packet = time_spent_packets[packet_key];

        if (!packet) {
          packet = new Sample("timespent");
          packet.data.integer = {
            unfocused: 0,
            hidden: 0,
            active: 0,
            unknown: 0,
            idle: 0,
          };

          packet.__ts = new Date(Date.now()).toISOString();

          packet.string("page", page);
          packet.string("context", context);
          time_spent_packets[packet_key] = packet;
        }

        return packet;

      }


      var lastChange = Date.now();
      var chunk_size = 500;
      var IDLE_TIMEOUT = 15; // 15 seconds

      var checks = 0;

      // TODO: report activity on a 'saturation' basis
      var checks_before_send = 1000 / chunk_size * session_size;
      function checkVisibility() {
        // Assign timings to who
        var hidden = document[hiddenProp];

        IDLE_TIMER += (chunk_size / 1000.0);

        checks++;

        if (CURRENT_URL !== TIME_SPENT_URL || CURRENT_CTX !== TIME_SPENT_CTX) {
          TIME_SPENT_URL = CURRENT_URL;
          TIME_SPENT_CTX = CURRENT_CTX;
        } else {
          // purposefully counting in chunk_size instead of in delta from the
          // last browser event, so we get a more accurate portrayal
          var delta = Date.now() - lastChange;

          var total_sample = get_time_spent_sample(TIME_SPENT_URL);
          bump_packet(total_sample.data.integer);
          if (TIME_SPENT_CTX) {
            var sample = get_time_spent_sample(TIME_SPENT_URL, TIME_SPENT_CTX);
            bump_packet(sample.data.integer);
          }

          function bump_packet(packet) {
            if (delta / 1000 > IDLE_TIMEOUT) {
              packet.unknown += (delta - IDLE_TIMEOUT) * 1000;
              delta = chunk_size;
            }


            if (IDLE_TIMER > IDLE_TIMEOUT) {
              packet.idle += chunk_size;
            } else if (hidden) {
              packet.hidden += chunk_size;
            } else if (unfocused) {
              packet.unfocused += chunk_size;
            } else {
              packet.active += chunk_size;
            }

            packet.unknown += delta - chunk_size;
          }
        }


        lastChange = Date.now();

        if (checks >= checks_before_send) {
          dump_packets();

          checks = 0;
        }

        setTimeout(checkVisibility, chunk_size);
      }

      checkVisibility();

      function dump_packets() {
        var keys = Object.keys(time_spent_packets);

        for (var i = 0; i < keys.length; i++) {
          time_spent_packets[keys[i]].send();
          delete time_spent_packets[keys[i]];
        }
      }
      addEvent(window, "beforeunload", dump_packets);


    },
    summarize: function() {

    }
  };

  // }}} TimeSpent

  // {{{ Pathing (Current URL & in-page context)
  // Monitors window.location and keeps track of when it changes
  var CURRENT_URL = null;
  var CURRENT_CTX = null;

  // TODO: CURRENT_URL needs to be parsed by the server and turned into a
  // controller/method pair properly
  var Pathing = {
    init: function() {
      function async_check() {
        setTimeout(function() {
          var new_url = window.location.pathname;
          if (CURRENT_URL !== new_url) {
            var sample = new Sample("pathing");

            // need to sanitize the URLs, probably...
            sample
              .string("page", new_url)
              .string("prev", CURRENT_URL)
              .send();


            CURRENT_URL = new_url;
          }

          async_check();
        }, 100);
      }

      async_check();

    }

  };

  // }}}
  // {{{ Performance
  var Performance = {
    init: function() {
      function checkPerf() {
        var s = new Sample("w3c_nav");
        // don't use CURRENT_URL because it won't be set yet
        s.string("page", window.location.pathname);

        if (typeof window.performance !== "undefined") {
          var perf = window.performance;
          if (typeof perf.timing !== "undefined") {
            var timing = perf.timing;
            var start = timing.navigationStart;
            s.integer("client_time", start);

            // .hasOwnProperty() doesn't work on timing, afaict
            for (var prop in timing) {
              var val = timing[prop];
              if (val >= 0) {
                s.integer(prop, Math.max(timing[prop] - start, 0));
              }
            }

            s.send();
          }
        }
      }

      if (document.readyState === "complete") {
        checkPerf();
      } else {
        addEvent(document, "readystatechange", function() {
          if (document.readyState === "complete") {
            checkPerf();
          }
        });
      }
    },

  };
  // }}}
  // }}}

  // {{{ MAIN INSTRUMENTATION MODULE
  var Instrumentation = {
    init: function() {
      UserActions.init();
      TimeSpent.init();
      Pathing.init();
      Performance.init();

    },
    Sample: Sample,
    UserActions: UserActions,
    TimeSpent: TimeSpent,
    Pathing: Pathing,
    Performance: Performance
  };

  if (typeof module !== "undefined") {
    module.exports = Instrumentation;
  }

  // }}}
})();
