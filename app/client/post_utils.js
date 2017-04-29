require("app/client/cordova");

module.exports = {
  update_post(post_id, text) {
    var replyEl = $("#reply" + post_id).children("small.text");
    if (!text) {
      replyEl.parent().fadeOut();
      if (window._POSTS[post_id]) {
        window._POSTS[post_id].$el.fadeOut();
      }

      return;
    }

    require("app/client/text", formatter => {
      var replyContainer = $("<div />");

      // Update our in memory text for this post
      var reply = window._REPLIES[post_id];
      if (reply) {
        reply.text = text;
      }

      replyEl.data("text", text);

      replyEl.fadeOut(1000, () => {
        replyEl.empty();
        replyEl.text(text);
        formatter.format_text(replyEl);
        replyEl.fadeIn();
      });
    });
  },
  freshen_links(post_id, links) {
    var post = window._POSTS && window._POSTS[post_id];
    SF.do_when(post, 'post' + post_id, () => {
      var postEl = $(".post[data-post-id=" + post_id + "]");

      _.each(links, link => {
        var textEl;
        if (link.post_id === post_id) {
          // Look for the link in postEls .op.text
          textEl = postEl.find(".op.text");
        } else {
          textEl = postEl.find("#reply" + link.post_id + " .text");
        }

        var a_candidates = textEl.find(".upboat");

        a_candidates.each(function() {
          var $this = $(this);
          var href = $this.data('href');
          var title = $this.data('text');

          if (href === link.href && title === link.title) {
            setTimeout(() => {
              $this.fadeOut(() => {
                $this.addClass('icon-arrow-up upboat');
                $this.removeClass('icon-coffee');
                $this.fadeIn();
              });
            }, link.remaining);

            $this.fadeOut(() => {
              $this.removeClass('icon-arrow-up');
              $this.removeClass("upboat");
              $this.addClass('icon-coffee');
              $this.fadeIn();

            });
          }
        });
      });

    });

  }
};
