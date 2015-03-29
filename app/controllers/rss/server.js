"use strict";

var context = require_core("server/context");
var controller = require_core("server/controller");
var Post = require_app("models/post");

var marked = require("marked");
global.marked = marked;

var client_text = require_app("client/text");

var RSS = require('rss');

var FEEDS = {};
var TIMERS = {};
var FEED_TIMEOUT = 60 * 1000;

function clear_feed(board) {
  if (!TIMERS[board]) {
    TIMERS[board] = setTimeout(function() {
      console.log("Clearing feed for board /" + board);
      delete FEEDS[board];
      delete TIMERS[board];

    }, FEED_TIMEOUT);
  }
}

function refresh_feed(board, cb) {
  if (FEEDS[board]) {
    cb(FEEDS[board]);
    return;
  }

  console.log("Generating feed for board /" + board);
  
  var where = {
    thread_id: null, 
    parent_id: null 

  };

  if (board !== "*") {
    where.board_id = board; 
  } else {
    where.board_id = [ "a", "b" ];
  }

  if (!FEEDS[board]) {
    Post.findAll({
        order: "bumped_at DESC",
        where: where,
        limit: 20
    }).success(function(results) {
      var feed = new RSS({
        title: "atob/" + board
      });

      _.each(results, function(post) {
        if (!post.bumped_at) {
          return;
        }

        var div = $("<div />");
        div.text(post.title);

        var title = client_text.format_text(div);
        title = div.text();
        feed.item({
          title: title + " [" + (post.replies || 0) + " replies]",
          description: post.text,
          url: "_ATOB_HOST_" + "/p/" + post.id,
          categories: [ post.board ],
          author: "anon",
          date: post.bumped_at
        });
      });

      FEEDS[board] = feed;
      clear_feed(board);

      cb(feed);
    });
  }
}

module.exports = {
  // If the controller has assets in its subdirs, set is_package to true
  is_package: false,
  routes: {
    "/:id" : "index",
  },

  index: function(ctx, api) {
    var board_id = ctx.req.params.id;

    refresh_feed(board_id, function(feed) {
      var hostname = ctx.req.headers.host;
      var xml_data = feed.xml();
      var proto = ctx.req.proto || "https";
      xml_data = xml_data.replace(/_ATOB_HOST_/g, proto + "://" + hostname);
      ctx.res.end(xml_data);
    });
  },

  socket: function() {}
};
