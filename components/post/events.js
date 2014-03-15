"use strict";

module.exports = { 
  // Component event handling goes here
  // This is purposefully kept separate from
  // the main component file, since it has code
  // that is generally not relevant to the server.
  events: {
    "click" :  "handle_template_click",
    "submit form": "handle_reply"
  },

  handle_reply: function(e) {
    e.preventDefault();
    var replyInput = this.$el.find(".reply input");
    var reply = replyInput.val();
    replyInput.val("");

    var postId = this.$el.find(".post").data("post-id");
    console.log(this, reply, postId);

    SF.socket().emit("new_reply", {
      post_id: postId,
      author: SF.controller().get_handle(),
      tripcode: SF.controller().get_tripcode(),
      text: reply
    });
  },

  handle_template_click: function() {
    console.log(this.id, "clicked");
  }
};
