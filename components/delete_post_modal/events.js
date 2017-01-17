"use strict";

module.exports = {
  events: {
    "click .delete" :  "handle_delete_post",
    "click .ban" :  "handle_ban_post",
    "click .star" :  "handle_star_post",
    "click .edit" : "handle_edit_post",
    "click .update" :  "handle_update_post",
    "keydown textarea" : "handle_typing"
  },
  post_to_controller: function(msg, options) {
    var author = this.$el.find("input[name=author]").val();
    var tripcode = this.$el.find("input[name=tripcode]").val();

    var post_id = this.options.reply_id;

    this.$el.find('.modal').modal('hide');
    SF.socket().emit(msg, _.extend({
      id: post_id,
      tripcode: tripcode,
      board: SF.controller().board,
      author: author
    }, options));


  },


  handle_update_post: function() {
    var text = this.$el.find("textarea[name=text]").val();
    this.post_to_controller("update_post", { text: text });
  },

  handle_ban_post: function() {
    this.post_to_controller("ban_post");
  },
  handle_delete_post: function() {
    this.post_to_controller("delete_post");
  },

  handle_star_post: function() {
    this.post_to_controller("star_post");
  },
  handle_typing: _.throttle(function() {

    // Update our preview with markdwon, too
    var replyInput = this.$el.find(".edit-post textarea");
    var reply = replyInput.val().trim();
    var escaped_reply = $("<div />").text(reply).html();

    var replyPreview = this.$el.find(".replypreview");
    if (replyPreview.is(":visible")) {
      replyPreview.empty();
      var replyContainer = $("<div />");
      replyContainer.text(escaped_reply);
      this.helpers['app/client/text'].format_text(replyContainer);
      replyPreview.append(replyContainer);
    }


  }, 100),

  handle_edit_post: function() {
    this.$el.find(".edit-post").fadeIn();
    this.$el.find(".edit")
      .text("done")
      .addClass("update")
      .removeClass("collapse")
      .removeClass("edit");
  },

};
