"use strict";

var settings = require("app/client/settings");
var post_utils = require("app/client/post_utils");
var notif = require("app/client/notif");
module.exports = {
  events: {
  },
  init: function() {
    this.init_tripcodes();
  },
  set_board: function(board) {
    this.board = board;
    this.trigger("set_board");
  },
  focus_post: function(id) {
    var self = this;
    setTimeout(function() {
      var dest = $("#reply" + id).filter(":visible");
      if (!dest.length) {
        self.focus_post(id);
      } else {
        $("body").scrollTo(dest, { duration: 400, offset: { top: -100 } });
      }

    }, 50);
  },
  socket: function(s) {
    notif.subscribe_to_socket(s);
    s.on("anons", this.handle_anonicators);
    s.on("doings", function(data) {
      var post = window._POSTS[data.post_id];
      if (post) {
        post.update_counts(data.counts);
      }

    });

    s.on("new_reply", function(data) {
      var post = window._POSTS[data.parent_id];
      if (post) {
        post.add_reply(data);
      }
    });

    s.on("joined", function(c) {
      console.log("Joined the board", c);
    });

    s.on("shake_post", function(post_id, duration) {
      var post = window._POSTS[post_id];
      if (post) {
        post.shake(duration);
      }
    });

    s.on("update_post", function(post_id, text) {
      post_utils.update_post(post_id, text);
    });

    s.on("notif", function(msg, type, options) {
      notif.handle_notif(msg, type, options);
    });

    var self = this;
    self.do_when(self.board, "set_board", function() {
      s.emit("join", self.board);
    });
  },
  goto: function(url) {
    // redirecting
    window.location = url;
  },
  hide_loading: function() {
    $(".loading").fadeOut();
  }
};

_.extend(module.exports, settings);
_.extend(module.exports.events, settings.controller_events);
