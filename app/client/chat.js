var HIDDEN = true;
var COUNT = 0;
module.exports = {
  add_socket_subscriptions: function(s) {
    s.on("new_chat", function(reply) {
      if (HIDDEN) {
        COUNT++;
        $(".chat .chat_header .counter").text("(" + COUNT + ")");
      }

      if (window._POSTS.chat) {
        window._POSTS.chat.add_reply(reply);
      }
    });

  },
  controller_events: {
    "click .chat_header" : "toggle_chat"
  },
  show_chat_popup: function() {
    this.$el.find(".chat_content").slideDown();
    this.$el.find(".chat").addClass("visible");
    var repliesEl = this.$el.find(".chat .replies");
    if (repliesEl.length) {
      repliesEl.scrollTop(repliesEl[0].scrollHeight);
    }
    COUNT = 0;
    $(".chat .chat_header .counter").empty();


  },
  hide_chat_popup: function() {
    this.$el.find(".chat_content").slideUp();
    this.$el.find(".chat").removeClass("visible");

  },
  toggle_chat: function() {
    HIDDEN = !HIDDEN;
    if (HIDDEN) {
      this.hide_chat_popup();
    } else {
      this.show_chat_popup();
    }
  },
  show_chat: function(post_id) {
    var tries = 0;
    function try_again() {
      tries++;
      _.delay(function() {
        try {
          window._POSTS.chat = window._POSTS[post_id];
        } catch (e) {
          if (tries < 20) {
            try_again();
          }
        }
      }, 300);
    }

    try_again();

    // This is where we can show and hide chat?
    $(".chat").removeClass("hidden");
    var repliesEl = $(".chat .replies");
    if (repliesEl.length) {
      repliesEl.scrollTop(repliesEl[0].scrollHeight);
    }

  },
};
