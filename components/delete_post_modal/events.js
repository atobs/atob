"use strict";

module.exports = {
  events: {
    "click .delete" :  "handle_delete_post",
    "click .edit" : "handle_edit_post",
    "click .update" :  "handle_update_post",
    "keydown textarea" : "handle_typing"
  },

  handle_update_post: function() {
    var author = this.$el.find("input[name=author]").val();
    var tripcode = this.$el.find("input[name=tripcode]").val();
    var text = this.$el.find("textarea[name=text]").val();

    var post_id = this.options.reply_id;

    this.$el.find('.modal').modal('hide');
    var self = this;

    SF.socket().emit("update_post", {
      id: post_id,
      tripcode: tripcode,
      author: author,
      text: text
    });
  },

  handle_typing: _.throttle(function() {

    // Update our preview with markdwon, too
    var replyInput = this.$el.find(".edit-post textarea");
    var reply = replyInput.val().trim();

    var replyPreview = this.$el.find(".replypreview");
    if (replyPreview.is(":visible")) {
      replyPreview.empty();
      var replyContainer = $("<div />");
      replyContainer.text(reply);
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

  handle_delete_post: function() {
    var author = this.$el.find("input[name=author]").val();
    var tripcode = this.$el.find("input[name=tripcode]").val();

    var post_id = this.options.reply_id;

    this.$el.find('.modal').modal('hide');

    SF.socket().emit("delete_post", {
      id: post_id,
      tripcode: tripcode,
      author: author
    });
  }
};
