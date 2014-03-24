
var format_text = require("app/client/text");

module.exports = {
  click_handler_uno: function() {
    console.log("Handling a click");
  },
  show_recent_threads: function() {
    $(".threads.recent.hidden .text").each(function() {
      format_text.add_icons($(this));
    });
    $(".threads.recent.hidden").removeClass("hidden").hide().fadeIn();
  },
  show_recent_posts: function() {
    $(".posts.recent.hidden .text").each(function() {
      format_text.add_icons($(this));
    });
    $(".posts.recent.hidden").removeClass("hidden").hide().fadeIn();
  }
};
