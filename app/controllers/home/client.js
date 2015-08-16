var settings = require("app/client/settings");

var tripcode_gen = require("app/client/tripcode").gen_tripcode;
var summarize = require("app/client/summarize");
var notif = require("app/client/notif");
var drawing = require("app/client/drawing");

require("app/client/cordova");

function hide_popovers(e) {
  $(e.target).popover("destroy");
  $(".popover").each(function() {
    if ($(this).hasClass("in")) {
      return;
    }
    
    $(this).popover("destroy").remove();
  });
}

function convert_post_text(post, cb) {
  require("app/client/text", function(format_text) {
    var postEl = $("<span />");
    postEl.text(post.text);

    format_text.add_markdown(postEl);
    post.formatted_text = postEl.html();

    cb(post);
  });


}

function format_and_show($el) {
  $el.find(".text").each(function() {
    var self = this;
    require("app/client/text", function(format_text) {
      format_text.add_upboats(false);
      format_text.add_markdown($(self));
    });
  });
  $el.removeClass("hidden").hide().fadeIn();
}

module.exports = {
  fullpage: function() {
    if ($("body").width() > 1280) {
      $(".front.recent").fadeOut();
      bootloader.css("jquery.fullPage", function() {
        bootloader.require("app/static/vendor/jquery.fullPage", function() {
          $("#fullpage .section.hidden").removeClass("hidden");
          $(".header").addClass("stayput");
          $("#fullpage").fullpage({
            normalScrollElements: ".chat .replies",
            verticalCentered: false,
            paddingTop: "132px",
            scrollBar: true
          });
        });
      });
    }
  },
  events: {
    "click .imglink" : "handle_mouseenter_imglink",
    "click .identity_tripcode" : "regen_tripcode",
    "click .upboat" : "handle_upboat_link",
    "click .tripcode" : "handle_click_tripcode",
    "mouseenter .imglink" : "handle_mouseenter_imglink",
    "mouseleave .imglink" : "handle_mouseleave_imglink",
    "mouseenter .ruleslink" : "handle_mouseenter_ruleslink",
    "mouseleave .ruleslink" : "handle_mouseleave_ruleslink"
  },

  handle_click_tripcode: function(e) {
    var target = $(e.target).closest(".tripcode");
    var tripcode = target.data("tripcode");

    window.open("/u/" + tripcode, "_blank");
  },

  handle_upboat_link: function(e) {
    var link = $(e.target).closest(".link");
    var arrow = link.find(".upboat");
    var linkId = link.data("linkid");

    SF.socket().emit("upboat", linkId, function() {
      arrow.fadeOut(function() {
        arrow.html("<span class='icon-heart' />");
        arrow.fadeIn();

      });
    });

  },
  handle_mouseenter_ruleslink: function(e) {
    e.preventDefault();
    e.stopPropagation();
    hide_popovers(e);

    var html = "" + "  <li>do not post anything that violates local or US law </li>" + "  <li>spamming, advertising and flooding is bad times</li>" + "  <li>posting or aksing for dox is is ban times</li>" + "  <li>any and all <a href='http://www.urbandictionary.com/define.php?term=shitposting'>shitposting</a> belongs in /b</li>"; 

    var div = $("<div />");
    div.html(html);

    _.defer(function() { 
      $(e.target).popover({
        html: true,
        content: div.html(),
        placement: "bottom",
        container: this.$el });

      $(e.target).popover("show");

    });

         

  },
  handle_mouseleave_ruleslink: function(e) {
    e.preventDefault();
    hide_popovers(e);

  },
  handle_mouseenter_imglink: function(e) {
    e.stopPropagation();
    e.preventDefault();
    hide_popovers(e);
    var responseEl = $("<div />");
    var img_link = $(e.target).closest(".imglink").attr("href");

    require("app/client/text", function(format_text) {
      var img_tag = format_text.format_image_link(img_link);
      responseEl.append(img_tag);
      _.defer(function() { 
        $(e.target).popover({
          html: true,
          content: responseEl.html(),
          placement: "auto",
          container: $("body") });

        $(e.target).popover("show");
      });

    });

  },
  handle_mouseleave_imglink: function(e) {
    hide_popovers(e);
  },

  format_text: function() {
    require("app/client/text", function(format_text) {
      format_text.add_upboats(false);
      var self = this;
      $(".text").each(function() {
          format_text.add_markdown($(self));
      });
    });
  },
  join_chat: function() {
    console.log("JOINING CHAT?");
  },
  show_chat: function() {
    var storage = require("app/client/storage");
    var tripcode_str = storage.get("tripcodes");
    var tripcodes = [];
    try {
      tripcodes = JSON.parse(tripcode_str);
    } catch (e) {

    }

    if (tripcodes.length) {
      // This is where we can show and hide chat?
      $(".chat").removeClass("hidden");
      var repliesEl = $(".chat .replies");
      if (repliesEl.length) {
        repliesEl.scrollTop(repliesEl[0].scrollHeight);
      }

    }
  },
  show_recent_threads: function() {
    format_and_show($(".threads.recent.hidden"));
  },
  show_recent_posts: function() {
    format_and_show($(".posts.recent.hidden"));
  },
  show_recent_links: function() {
    format_and_show($(".links.recent.hidden"));
  },
  gen_tripcodes: function() {
    $(".tripcode").each(function() {
      tripcode_gen(this);
    });
  },
  gen_tagcloud: function() {
    bootloader.require("app/static/vendor/jquery.tagcloud", function() {
      $(".tagcloud a").tagcloud({
        color: {start: '#8aa', end: '#aaf'} ,
        size: { start: 2, end: 4, unit: 'em' } 
      }).css("margin", "10px");;

      $(".tagcloud")
        .fadeOut(function() {
          $(this)
            .removeClass("hidden")
            .fadeIn();
        });
    });
  },
  socket: function(s) {

    notif.subscribe_to_socket(s);
    s.on("notif", function(msg, type, options) {
      notif.handle_notif(msg, type, options);
    });

    s.on("new_chat", function(reply) {
      var only_post = _.keys(_POSTS)[0];
      if (only_post) {
        _POSTS[only_post].add_reply(reply);
      }
    });

    s.on("new_reply", function(reply) {
      var postParent = $(".posts .post").parent();
      reply.id = reply.post_id || reply.id;


      var self = this;
      convert_post_text(reply, function(reply) {
        reply.text = reply.formatted_text;
        var summarize = require("app/client/summarize");

        var summary = $(summarize(reply)).addClass("new_summary");
        summary.hide();
        postParent.prepend(summary);
        $(".new_summary").fadeIn().removeClass("new_summary");
      });



    });

    s.on("bestalked", this.be_stalked);
    s.on("stalking", this.be_stalker);

    s.on("new_post", function(post) {

      convert_post_text(post, function(post) {
        post.text = post.formatted_text;
        var postParent = $(".threads .post").parent();
        post.id = post.post_id || post.id;
        var summarize = require("app/client/summarize");
        var summary = $(summarize(post)).addClass("new_summary");
        summary.hide();
        postParent.prepend(summary);
        $(".new_summary").fadeIn().removeClass("new_summary");

        postParent.find(".post").last().fadeOut().remove();

      });
    });

    settings.add_socket_subscriptions(s);
  }
};

_.extend(module.exports, settings);
_.extend(module.exports.events, settings.controller_events);

var newthread = require("app/client/newthread");

_.extend(module.exports, newthread);
_.extend(module.exports.events, newthread.controller_events);
