"use strict";

require("core/client/component");

module.exports = {
  events: {
    "submit form.new_post" : "add_post" 
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

    $(e.target).find("input").val(""); 

    SF.socket().emit("new_post", datas);
  },
  init: function() {
    this.$page.find("input.tripcode").chromaHash({bars: 4});
  },
  set_board: function(b) {
    console.log("Seeing whats up for board", "/" + b);
    this.board = b;
    this.trigger("set_board");
  },
  get_tripcode: function() {
    return md5($("input.tripcode").val());
  },
  get_handle: function() {
    return $("input.handle").val();
  },
  socket: function(s) {
    s.on("new_post", function(data) {
      $C("post", data, function(cmp) {
        $(".posts").prepend(cmp.$el);
      });
    });

    s.on("new_reply", function(data) {
      var post = window._POSTS[data.parent_id];
      post.add_reply(data);
      // Need to route it to the right post, somehow

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
