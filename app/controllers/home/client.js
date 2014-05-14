var settings = require("app/client/settings");

var tripcode_gen = require("app/client/tripcode").gen_tripcode;
var summarize = require("app/client/summarize");

module.exports = {
  click_handler_uno: function() {
    console.log("Handling a click");
  },
  format_text: function() {
    require("app/client/text", function(format_text) {
      var self = this;
      $(".text").each(function() {
          format_text.add_markdown($(self));
          format_text.add_icons($(self));
      });
    });
  },
  show_recent_threads: function() {
    $(".threads.recent.hidden .text").each(function() {
      var self = this;
      require("app/client/text", function(format_text) {
        format_text.add_markdown($(self));
        format_text.add_icons($(self));
      });
    });
    $(".threads.recent.hidden").removeClass("hidden").hide().fadeIn();
  },
  show_recent_posts: function() {
    $(".posts.recent.hidden .text").each(function() {
      var self = this;
      require("app/client/text", function(format_text) {
        format_text.add_markdown($(self));
        format_text.add_icons($(self));
      });
    });
    $(".posts.recent.hidden").removeClass("hidden").hide().fadeIn();
  },
  gen_tripcodes: function() {
    $(".tripcode").each(function() {
      tripcode_gen(this);
    });
  },
  socket: function(s) {
    s.on("new_reply", function(reply) {
      console.log("NEW REPLY", reply);
      var postParent = $(".posts .post").parent();
      reply.id = reply.post_id || reply.id;
      var summary = $(summarize(reply));
      summary.hide();
      postParent.prepend(summary);
      summary.fadeIn();

      postParent.find(".post").last().fadeOut().remove();
    });

    s.on("new_post", function(post) {
      var postParent = $(".threads .post").parent();
      post.id = post.post_id || post.id;
      var summary = $(summarize(post));
      summary.hide();
      postParent.prepend(summary);
      summary.fadeIn();

      postParent.find(".post").last().fadeOut().remove();
    });

    s.on("doings", function(doings) {
      
      var counts = {};
      _.each(doings, function(anons) {
        _.each(anons, function(emote, id) {
          counts[id] = emote;
        });
      });

      var lookup = {
        t: "icon-keyboardalt",
        f: "icon-glassesalt",
        u: "icon-glassesalt"
      };

      var str = _.map(_.values(counts), function(c) {
        return "<i class='" + (lookup[c[0]] || "icon-" + c.replace(/:/g, "")) + "' />";
      });


      $("#anons").html(str.join(" "));

    });
  }
};
_.extend(module.exports, settings);
