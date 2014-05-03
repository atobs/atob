module.exports = {
  update_post: function(post_id, text) {
    var replyEl = $("#reply" + post_id).children("small.text");
    if (!text) {
      replyEl.parent().fadeOut();
      if (window._POSTS[post_id]) {
        window._POSTS[post_id].$el.fadeOut();
      }

      return;
    }

    require("app/client/text", function(formatter) {
      var replyContainer = $("<div />");
      replyContainer.text(text);
      formatter.format_text(replyContainer);

      replyEl.fadeOut(1000, function() {
        replyEl.empty();
        replyEl.append(replyContainer);
        replyEl.fadeIn();
      });
    });
  }
};
