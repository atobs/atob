var settings = require("app/client/settings");

var tripcode_gen = require("app/client/tripcode").gen_tripcode;
var summarize = require("app/client/summarize");
var notif = require("app/client/notif");
var drawing = require("app/client/drawing");
var chat = require("app/client/chat");

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
  require("app/client/text", format_text => {
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
    require("app/client/text", format_text => {
      format_text.add_upboats(false);
      format_text.add_markdown($(self));
    });
  });
  $el.removeClass("hidden").hide().fadeIn();
}

module.exports = {
  fullpage() {
  },
  events: {
    "click .imglink" : "handle_mouseenter_imglink",
    "click .identity_tripcode" : "regen_tripcode",
    "click .upboat" : "handle_upboat_link",
    "click .tripcode" : "handle_click_tripcode",
    "click .composer_toggle" : "handle_composer_toggle",
    "mouseenter .imglink" : "handle_mouseenter_imglink",
    "mouseleave .imglink" : "handle_mouseleave_imglink",
    "mouseenter .ruleslink" : "handle_mouseenter_ruleslink",
    "mouseleave .ruleslink" : "handle_mouseleave_ruleslink"
  },

  handle_click_tripcode(e) {
    var target = $(e.target).closest(".tripcode");
    var tripcode = target.data("tripcode");

    window.open("/u/" + tripcode, "_blank");
    e.preventDefault();
    e.stopPropagation();
  },

  handle_composer_toggle(e) {
    console.log("WRITING NEW POST");
    this.$el.find(".new_post").slideToggle();
    this.init_tripcodes();

  },

  handle_upboat_link(e) {
    var link = $(e.target).closest(".link");
    var arrow = link.find(".upboat");
    var linkId = link.data("linkid");

    SF.socket().emit("upboat", linkId, () => {
      arrow.fadeOut(() => {
        arrow.html("<span class='icon-heart' />");
        arrow.fadeIn();

      });
    });

  },
  handle_mouseenter_ruleslink(e) {
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
  handle_mouseleave_ruleslink(e) {
    e.preventDefault();
    hide_popovers(e);

  },
  handle_mouseenter_imglink(e) {
    e.stopPropagation();
    e.preventDefault();
    hide_popovers(e);
    var responseEl = $("<div />");
    var img_link = $(e.target).closest(".imglink").attr("href");

    require("app/client/text", format_text => {
      var img_tag = format_text.format_image_link(img_link);
      responseEl.append(img_tag);
      _.defer(() => { 
        $(e.target).popover({
          html: true,
          content: responseEl.html(),
          placement: "auto",
          container: $("body") });

        $(e.target).popover("show");
      });

    });

  },
  handle_mouseleave_imglink(e) {
    hide_popovers(e);
  },

  format_text() {
    require("app/client/text", function(format_text) {
      format_text.add_upboats(false);
      var self = this;
      $(".text").each(() => {
          format_text.add_markdown($(self));
      });
    });
  },
  join_chat(id) {
    var chat_id = _.keys(window._POSTS)[0];

    SF.socket().on("new_chat", reply => {
      if (window._POSTS[chat_id]) {
        window._POSTS[chat_id].add_reply(reply);
      }
    });

  },
  show_recent_threads() {
    format_and_show($(".threads.recent.hidden"));
  },
  show_recent_posts() {
    format_and_show($(".posts.recent.hidden"));
  },
  show_recent_links() {
    format_and_show($(".links.recent.hidden"));
  },
  gen_tripcodes() {
    $(".tripcode").each(function() {
      tripcode_gen(this);
    });
  },
  gen_tagcloud() {
    bootloader.require("app/static/vendor/jquery.tagcloud", () => {
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
  socket(s) {

    notif.subscribe_to_socket(s);
    s.on("notif", (msg, type, options) => {
      notif.handle_notif(msg, type, options);
    });

    chat.add_socket_subscriptions(s);

    s.on("new_reply", function(reply) {
      var postParent = $(".posts .post").parent();
      reply.id = reply.post_id || reply.id;


      var self = this;
      convert_post_text(reply, reply => {
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

    s.on("new_post", post => {

      convert_post_text(post, post => {
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

_.extend(module.exports, chat);
_.extend(module.exports.events, chat.controller_events);

_.extend(module.exports, settings);
_.extend(module.exports.events, settings.controller_events);

var newthread = require("app/client/newthread");

_.extend(module.exports, newthread);
_.extend(module.exports.events, newthread.controller_events);
