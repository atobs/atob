"use strict";

require("core/client/component");
var settings = require("app/client/settings");


module.exports = {
  events: {
    "submit form.new_post" : "add_post",
    "change input.tripcode" : "save_tripcode",
    "change input.handle" : "save_handle",
    "keyup input.tripcode" : "update_trip_colors",
    "keyup input.handle" : "update_trip_colors",
    "change input.newtrip" : "save_newtrip"
  },
  add_post: function(e) {
    e.preventDefault();

    var serialized = $(e.target).serializeArray();
    var datas = {};
    _.each(serialized, function(obj) {
      datas[obj.name] = obj.value;
    });

    var tripcode = this.get_tripcode();
    var handle = this.get_handle();

    datas.tripcode = tripcode;
    datas.author = handle;

    if (datas.title.trim() === "" && datas.text.trim() === "") {
      return;
    }

    $(e.target).find("input, textarea").val("");

    SF.socket().emit("new_post", datas);
  },
  init: function() {
    this.init_tripcodes();
    SF.trigger("board_ready");
  },
  set_board: function(b) {
    console.log("Seeing whats up for board", "/" + b);
    this.board = b;
    this.trigger("set_board");
  },
  socket: function(s) {
    s.on("new_post", function(data) {
      $C("post", data, function(cmp) {
        $(".posts").prepend(cmp.$el);
      });
    });

    s.on("doings", function(data) {
      var post = window._POSTS[data.post_id];
      if (post) {
        post.update_counts(data.counts);
      }

    });

    s.on("new_reply", function(data) {
      var post = window._POSTS[data.parent_id];
      post.add_reply(data);

      var focusedPost = $(document.activeElement).parents(".post");
      if (post.$el.find(".post")[0] !== focusedPost[0]) {
        // Need to route it to the right post, somehow

        var parent = post.$el.parent();
        post.$el.stop(true, true).fadeOut(function() {
          parent.prepend(post.$el);
          post.$el.fadeIn(function() {
            post.bumped(); 
          });
        });

      }

    });

    s.on("joined", function(c) {
      console.log("Joined the board", c);
    });

    var self = this;
    self.do_when(self.board, "set_board", function() {
      s.emit("join", self.board);
    });
  }
};

_.extend(module.exports, settings);
