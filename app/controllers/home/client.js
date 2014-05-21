var settings = require("app/client/settings");

var tripcode_gen = require("app/client/tripcode").gen_tripcode;
var summarize = require("app/client/summarize");

module.exports = {
  events: {
    "click .imglink" : "handle_mouseenter_imglink",
    "mouseenter .imglink" : "handle_mouseenter_imglink",
    "mouseleave .imglink" : "handle_mouseleave_imglink",
  },
  handle_mouseenter_imglink: function(e) {
    e.stopPropagation();
    e.preventDefault();
    $(e.target).popover("destroy");
    var responseEl = $("<div />");
    var img_link = $(e.target).attr("href");

    var img_tag = $("<img />") .attr("src", img_link);
    img_tag.css("max-height", "200px");
    img_tag.css("max-width", "100%");
    img_tag.css("display", "block");
    responseEl.append(img_tag);

    $(e.target).popover({
      html: true,
      content: responseEl.html(),
      placement: "right",
      container: this.$el });

    $(e.target).popover("show");

  },
  handle_mouseleave_imglink: function(e) {
    $(e.target).popover("destroy");
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
