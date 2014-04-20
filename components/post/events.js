"use strict";

module.exports = {
  // Component event handling goes here
  // This is purposefully kept separate from
  // the main component file, since it has code
  // that is generally not relevant to the server.
  events: {
    "click .restore" :  "handle_restore",
    "click .glyphs" :  "handle_click_glyphs",
    "click .addglyph" :  "handle_addglyph",
    "submit form": "handle_reply",
    "keydown .post .reply textarea" : "handle_maybe_submit",
    "keydown .reply textarea" : "handle_typing",
    "blur .reply textarea" : "handle_unfocus",
    "focus .reply textarea" : "handle_focus",
    "click .addreply" : "handle_addreply",
    "click .deletereply" : "handle_deletereply",
    "click .truncable" : "handle_click_truncable",
    "click .show_more" : "handle_see_more",
    "click .imglink" : "handle_mouseenter_imglink",
    "mouseenter .imglink" : "handle_mouseenter_imglink",
    "mouseleave .imglink" : "handle_mouseleave_imglink",
    "mouseenter .post" : "handle_removepulse",
    "mouseleave .post" : "handle_removepulse",
    "mousemove .post" : "handle_removepulse",
    "mouseenter .replylink" : "handle_mouseenter_replylink",
    "mouseleave .replylink" : "handle_mouseleave_replylink"
  },

  handle_click_truncable: function(e) {
    $(e.target).closest(".truncable").toggleClass("hideContent");
  },

  handle_see_more: function(e) {
    $(e.target).closest("a").siblings(".truncable").toggleClass("hideContent");
  },

  handle_deletereply: function(e) {
    e.preventDefault();
    // Need to present the modal dialog and all that jazz for deleting this reply.
    var reply = $(e.target).closest("a").data("parent-id");
    var tripcode = SF.controller().get_triphash();
    var author = SF.controller().get_handle();
    $C("delete_post_modal", { tripcode: tripcode, reply_id: reply, author: author});
  },
  handle_addreply: function(e) {
    e.preventDefault();
    var textarea = this.$el.find(".reply textarea");
    textarea.focus();
    textarea.val(textarea.val() + " >>" + $(e.target).closest("a").attr("data-parent-id") + " ");
  },

  handle_removepulse: _.throttle(function() {
    this.$el.find(".post").removeClass("pulse");
  }, 200),

  handle_mouseenter_imglink: function(e) {
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

  handle_mouseenter_replylink: function(e) {
    var clone_id = $(e.target).data("parent-id");
    var responseEl = $("#reply" + clone_id);
    var container = this.$el;

    $(e.target).popover({ html: true, content: responseEl.html(), placement: "top", container: container });
    $(e.target).popover("show");
  },

  handle_mouseleave_replylink: function(e) {
    $(e.target).popover("destroy");
  },

  handle_addglyph: function(e) {
    var glyph = $(e.target).data("glyph");
    var textarea = this.$el.find(".reply textarea");
    textarea.focus();
    textarea.val(textarea.val() + " :" + glyph + ": ");

    $('.popover.in').each(function () {
      $(this).popover("destroy");
    });
  },
  handle_click_glyphs: function(e) {
    var container = this.$el;
    var glyphs = [
      "emojigrin",
      "emojidead",
      "blankstare",
      "laugh",
      "thumbs-up",
      "thumbs-down",
      "batman",
      "ironman",
      "catface",
      "ghost",
      "poop",
      "law"
      ];

    var outerEl = $("<div />");
    var responseEl = $("<div class='clearfix' />");
    outerEl.append(responseEl);
    _.each(glyphs, function(glyph) {
      var glyphContainer = $("<div class='ptl col-md-3 col-xs-3' />");
      var glyphEl = $("<div class='addglyph' />");
      glyphEl.data("glyph", glyph);
      glyphEl.addClass("icon-" + glyph);
      glyphContainer.append(glyphEl);
      responseEl.append(glyphContainer);
    });

    $(e.target).popover({
      html: true,
      content: outerEl,
      placement: "top",
      container: container });


    $(e.target).popover("show");
    _.defer(function() {
      $("body").one("click", function() {
        $(e.target).popover("destroy");
      });
    }, 50);
  },

  handle_restore: function(e) {
    this.$el.find(".post").toggleClass("maximize");
    var maximized = this.$el.find(".post").hasClass("maximize");
    if (maximized) {
      this.$el.find(".restore.link").html("[collapse]");
    } else {
      this.$el.find(".restore.link").html("[expand]");
    }

    this.bumped();
    e.preventDefault();
  },

  handle_maybe_submit: function(e) {
    if (e.keyCode === 13 && !e.shiftKey) {
      this.handle_reply(e);
      return true;
    }

  },

  // Alright. so we rely on users updating their socket status.  any one socket
  // can either be: 1. doing nothing, 2. typing a reply, 3. watching a post
  handle_typing: _.throttle(function() {

    SF.socket().emit("isdoing", { what: "typing", post_id: this.get_post_id()});

    // Update our preview with markdwon, too
    var replyInput = this.$el.find(".reply textarea");
    var reply = replyInput.val().trim();

    var replyPreview = this.$el.find(".replypreview");
    if (replyPreview.is(":visible")) {
      replyPreview.text(reply);
      this.helpers['app/client/text'].format_text(replyPreview);
    }


  }, 500),
  handle_unfocus: function() {
    SF.socket().emit("isdoing", { what: "unfocused", post_id: this.get_post_id()});
    var replyPreview = this.$el.find(".replypreview");
    replyPreview.fadeOut();
  },
  handle_focus: function() {
    this.expand();
    var replyPreview = this.$el.find(".replypreview");
    replyPreview.fadeIn();
    SF.socket().emit("isdoing", { what: "focused", post_id: this.get_post_id()});
  },

  handle_reply: function(e) {
    e.preventDefault();
    var replyInput = this.$el.find(".reply textarea");
    var replyPreview = this.$el.find(".replypreview");
    var reply = replyInput.val();

    if (reply.trim() === "") {
      return;
    }

    var postId = this.get_post_id();


    var author = SF.controller().get_handle();
    var tripcode = SF.controller().get_tripcode();
    var triphash = SF.controller().get_triphash();
    SF.socket().emit("new_reply", {
      post_id: postId,
      author: author,
      tripcode: triphash,
      text: reply
    }, function() {
      // Success or not...
      replyInput.val("");
      replyPreview.text("");
      SF.controller().remember_tripcode(author, tripcode);
    });
  },

  handle_template_click: function() {
    this.handle_focus();
  }

};
