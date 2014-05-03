'use strict';

module.exports = {
  tagName: "div",
  className: "",
  defaults: {
    content: "default content"
  },
  show: function() {
    this.$el.find(".modal").modal('show');
  },
  hide: function() {
    this.$el.find(".modal").modal('hide');
  },
  initialize: function(options) {
    this.reply_id = options.reply_id;
  },
  client: function(options) {
    this.$el.find(".modal").modal();

    if (!window._REPLIES) {
      return;
    }

    var reply = window._REPLIES[this.reply_id];
    var tripcode = SF.controller().get_triphash();
    var author = SF.controller().get_handle();

    var tripdone = window.md5(author + ":" + tripcode);
    if (reply) {
      if (reply.tripcode === tripdone) {
        this.$el.find(".reportable").fadeOut();
        this.$el.find(".editable").fadeIn().css("display", "inline-block");
      } else{
        this.$el.find(".reportable").fadeIn().css("display", "inline-block");
        this.$el.find(".editable").fadeOut();
      }
    }

    $(document.body).append(this.$el);
  }
};
