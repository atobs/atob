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

//    SF.socket().trigger("new_reply", {
//
//    });
  },

  handle_template_click: function() {
    console.log(this.id, "clicked");
  }
};
