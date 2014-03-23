"use strict";

module.exports = { 
  // Component event handling goes here
  // This is purposefully kept separate from
  // the main component file, since it has code
  // that is generally not relevant to the server.
  events: {
    "click .restore" :  "handle_restore",
    "submit form": "handle_reply",
    "keyup .reply textarea" : "handle_maybe_submit",
    "keydown .reply textarea" : "handle_typing",
    "blur .reply textarea" : "handle_unfocus",
    "focus .reply textarea" : "handle_focus",
    "click .addreply" : "handle_addreply",
    "mouseenter .replylink" : "handle_mouseenter_replylink",
    "mouseenter .post" : "handle_removepulse",
    "mouseleave .post" : "handle_removepulse",
    "mousemove .post" : "handle_removepulse",
    "mouseleave .replylink" : "handle_mouseleave_replylink"
  },

  handle_addreply: function(e) {
    var textarea = this.$el.find(".reply textarea");
    textarea.focus();
    textarea.val(textarea.val() + " >>" + $(e.target).closest("a").attr("data-parent-id") + " ");
  },

  handle_removepulse: _.throttle(function() {
    this.$el.find(".post").removeClass("pulse");
  }, 200),

  handle_mouseenter_replylink: function(e) {
    var clone_id = $(e.target).data("parent-id");
    var responseEl = $("#reply" + clone_id);

    $(e.target).popover({ html: true, content: responseEl.html(), placement: "top" });
    $(e.target).popover("show");
  },

  handle_mouseleave_replylink: function(e) {
    $(e.target).popover("hide");
  },

  handle_restore: function(e) {
    this.$el.find(".post").toggleClass("maximize");
    var maximized = this.$el.find(".post").hasClass("maximize");
    if (maximized) {
      this.$el.find(".restore.link").html("[collapse]");
    } else {
      this.$el.find(".restore.link").html("[expand]");
    }

    this.bumped();
    e.preventDefault();
  },

  handle_maybe_submit: function(e) {
    if (e.keyCode === 13 && !e.shiftKey) {
      this.handle_reply(e);
      return true;
    }

  },

  // Alright. so we rely on users updating their socket status.  any one socket
  // can either be: 1. doing nothing, 2. typing a reply, 3. watching a post
  handle_typing: _.throttle(function() {
    SF.socket().emit("isdoing", { what: "typing", post_id: this.get_post_id()});
  }, 500),
  handle_unfocus: function() {
    SF.socket().emit("isdoing", { what: "unfocused", post_id: this.get_post_id()});
  },
  handle_focus: function() {
    this.expand();
    SF.socket().emit("isdoing", { what: "focused", post_id: this.get_post_id()});
  },

  handle_reply: function(e) {
    e.preventDefault();
    var replyInput = this.$el.find(".reply textarea");
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
