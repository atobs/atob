"use strict";

module.exports = { 
  // Component event handling goes here
  // This is purposefully kept separate from
  // the main component file, since it has code
  // that is generally not relevant to the server.
  events: {
    "click" :  "handle_template_click",
    "submit form": "handle_reply",
    "keydown .reply input" : "handle_typing",
    "blur .reply input" : "handle_unfocus",
    "focus .reply input" : "handle_focus"
  },

  // Alright. so we rely on users updating their socket status.  any one socket
  // can either be: 1. doing nothing, 2. typing a reply, 3. watching a post
  handle_typing: _.throttle(function() {
    SF.socket().emit("isdoing", { what: "typing", post_id: this.get_post_id()});
  }, 500),
  handle_unfocus: function() {
    this.collapse();
    SF.socket().emit("isdoing", { what: "unfocused", post_id: this.get_post_id()});
  },
  handle_focus: function() {
    this.expand();
    SF.socket().emit("isdoing", { what: "focused", post_id: this.get_post_id()});
  },

  handle_reply: function(e) {
    e.preventDefault();
    var replyInput = this.$el.find(".reply input");
    var reply = replyInput.val();
    replyInput.val("");

    if (reply.trim() === "") {
      return;
    }

    var postId = this.get_post_id();

    SF.socket().emit("new_reply", {
      post_id: postId,
      author: SF.controller().get_handle(),
      tripcode: SF.controller().get_tripcode(),
      text: reply
    });
  },

  handle_template_click: function() {
    this.handle_focus();
  }

};
