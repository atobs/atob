"use strict";

require("core/client/component");

module.exports = {
  events: {
    "submit form.new_post" : "add_post" 
  },
  add_post: function(e) {
    console.log("Adding a new post");

    e.preventDefault();

    console.log(e.target);
    var data = $(e.target).serializeArray();
    var tripcode = md5($("input.tripcode").val());
    data.push({ name: "tripcode", value: tripcode });
    console.log("NEW POST", data);
    SF.socket().emit("new_post", data);
      
  },
  init: function() {
    this.$page.find("input.tripcode").chromaHash({bars: 4});
  },
  set_board: function(b) {
    console.log("Seeing whats up for board", "/" + b);
    this.board = b;
    this.trigger("set_board");
  },
  socket: function(s) {
    s.on("new_post", function(data) {
      console.log("New post created!");
      $C("post", data, function(cmp) {
        console.log("New post created", cmp); 
        $(".posts").prepend(cmp.$el);
      });


    });

    s.on("new_reply", function() {

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
