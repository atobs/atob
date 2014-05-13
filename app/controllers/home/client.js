var settings = require("app/client/settings");

var tripcode_gen = require("app/client/tripcode").gen_tripcode;

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
