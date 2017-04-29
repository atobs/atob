"use strict";

require("app/client/summarize");

var last_update = null;
var last_query = null;

module.exports = {
  events: {
    "keydown .searchinput" : "handle_search_keydown"

  },
  init() {

  },
  display_results(results) {
    // we need to bump the queue to display results, i guess
    var self = this;
    self.latest_results = results;
    self.throttled_display_results();
  },
  throttled_display_results: _.throttle(function() {
    var self = this;
    var div = $("<div />");

    var summarize = require("app/client/summarize");
    if (!self.latest_results.length) {
      div.append("you shout, but there is no answer");
    }

    _.each(self.latest_results, r => {
      var el = summarize(r);
      var elel = $("<div />").append(el);

      div.append(elel);
    });

    var results_hash = window.md5(div.html());

    if (results_hash !== self.previous_results_hash) {
      var resultsEl = $(".results");
      resultsEl.empty();
      resultsEl.append(div);
    }
    self.previous_results_hash = results_hash;


  }, 1000),
  socket(s) {
    var self = this;
    s.on("queryresults", (results, q, ts) => {
      if (!last_update || ts > last_update) {
        // now we display the results
        self.display_results(results);

        SF.replace("/s/?q=" + q);

        last_update = ts;
      }

    });

  },
  handle_search_keydown: _.throttle(() => {
    var query = $(".searchinput").val();
    if (query === last_query) {
      return;
    }

    SF.socket().emit("query", query);
    last_query = query;

  }, 500)
};
