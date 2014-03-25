"use strict";

module.exports = {
  events: {
    "click .delete" :  "handle_delete_post"
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
