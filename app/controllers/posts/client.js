"use strict";

var settings = require("app/client/settings");
var notif = require("app/client/notif");
module.exports = {
  events: {
    "change input.tripcode" : "save_tripcode",
    "change input.handle" : "save_handle",
    "keyup input.tripcode" : "update_trip_colors",
    "keyup input.handle" : "update_trip_colors",
    "change input.newtrip" : "save_newtrip",
    "click .identity_tripcode" : "regen_tripcode",
    "click .regen_tripcode" : "regen_tripcode",
    "click .tripcode_button" : "restore_old_code",
    "click .tripcode_delete" : "delete_old_code",
    "click .tripcode_history" : "tripcode_history"
  },
  init: function() {
    this.init_tripcodes();
  },
  set_board: function(board) {
    this.board = board;
    this.trigger("set_board");
  },
  focus_post: function(id) {
    $("#reply" + id)[0].scrollIntoView();
  },
  socket: function(s) {
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
  }
};

_.extend(module.exports, settings);
