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

    var lastTime = (new Date()).getTime();

    // http://stackoverflow.com/questions/4079115/can-any-desktop-browsers-detect-when-the-computer-resumes-from-sleep
    // if the page becomes inactive for long enough, reload it on the next focus
    setInterval(function() {
      var currentTime = (new Date()).getTime();
      if (currentTime > (lastTime + 15000)) {  // ignore small delays
        window.location.reload();
      }
      lastTime = currentTime;
    }, 2000);

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
      if (post) {
        post.add_reply(data);
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
