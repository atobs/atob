'use strict';

module.exports = {
  tagName: "div",
  className: "",
  defaults: {
    content: "default content"
  },
  show() {
    this.$el.find(".modal").modal('show');
  },
  hide() {
    this.$el.find(".modal").modal('hide');
  },
  initialize(options) {
    this.reply_id = options.reply_id;
  },
  client(options) {
    this.$el.find(".modal").modal();

    if (!window._REPLIES) {
      return;
    }

    var reply = window._REPLIES[this.reply_id];
    var tripcode = SF.controller().get_triphash();
    var author = SF.controller().get_handle();

    var tripdone = window.md5(author + ":" + tripcode);
    var self = this;
    if (reply) {
      if (reply.tripcode === tripdone) {
        self.$el.find(".reportable").fadeOut();
        self.$el.find(".editable").fadeIn().css("display", "inline-block");
      } else {
        self.$el.find(".editable").fadeOut();
        self.$el.find(".reportable").fadeIn().css("display", "inline-block");
      }
    }

    var board = SF.controller().board;

    SF.controller().emit("adminme", board, author, tripcode, (isclaimed, isowner) => {
      if (isowner) {
        self.$el.find(".reportable, .editable").hide();
        self.$el.find(".deletable").css("display", "inline-block").show();

        if (window._POSTS[self.reply_id]) {
          self.$el.find(".starrable").css("display", "inline-block").show();
          var post = window._POSTS[self.reply_id];
          if (post.is_starred()) {
            self.$el.find(".starrable").text("unstick");
          } else {
            self.$el.find(".starrable").text("sticky");
          }
        }

      }

    });

    $(document.body).append(this.$el);
  }
};
