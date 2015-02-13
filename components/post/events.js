"use strict";

var CLIENT_COMMANDS = {
  "/makeme" : function(cmd, icon) {
    var postId = this.get_post_id();

    icon = $("<div />").html(icon).text();

    SF.socket().emit("isdoing", { 
      post_id: postId,
      what: icon
    });
  }
};

module.exports = {
  // Component event handling goes here
  // This is purposefully kept separate from
  // the main component file, since it has code
  // that is generally not relevant to the server.
  events: {
    "click .upboat" : "handle_upboat_link",
    "click .tripcode" : "handle_click_tripcode",
    "click .restore" :  "handle_restore",
    "click .formatting_help" :  "handle_click_help",
    "click .addglyph" :  "handle_addglyph",
    "click .boardlink" : "handle_click_boardlink",
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
    "click .replylink" : "handle_mouseenter_replylink",
    "mouseenter .replylink" : "handle_mouseenter_replylink",
    "mouseleave .replylink" : "handle_mouseleave_replylink"
  },

  handle_click_tripcode: function(e) {
    var target = $(e.target).closest(".tripcode");
    var tripcode = target.data("tripcode");

    window.open("/u/" + tripcode, "_blank");
  },

  handle_click_boardlink: function(e) {
    e.preventDefault();
    var dest = $(e.target).closest(".boardlink").attr("href");
    window.open(dest, '_blank');
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

    var replyEl = $(e.target).closest(".reply");
    var postEl = $(e.target).closest(".post");
    var text = "";
    if (replyEl.length) {
      text = replyEl.find("small.text.marked").data("text");
    } else if (postEl.length) {
      text = postEl.find(".op.text.marked").data("text");
    }

    text = $("<div />").html(text).text();

    $C("delete_post_modal", { tripcode: tripcode, reply_id: reply, author: author, text: text});
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
    e.stopPropagation();

    $(e.target).popover("destroy");

    var responseEl = $("<div />");
    var img_link = $(e.target).closest(".imglink").attr("href");
    var img_tag = this.helpers['app/client/text'].format_image_link(img_link);
    responseEl.append(img_tag);

    $(e.target).popover({
      html: true,
      content: responseEl.html(),
      placement: "bottom",
      container: this.$el });

    _.defer(function() { 
      $(e.target).popover("show");
    });

  },
  handle_mouseleave_imglink: function(e) {
    $(e.target).popover("destroy");
  },

  handle_mouseenter_replylink: function(e) {
    e.stopPropagation();

    var container = this.$el;
    var expanded = {};

    function get_reply_content(el) {
      var clone_id = $(el).data("parent-id");
      if (expanded[clone_id]) {
        return $("<div />");
      }

      expanded[clone_id] = true;
      var responseEl = $("#reply" + clone_id);
      return responseEl.clone();
    }
    
    function buildreply_popup(el, anchor) {
      var responseEl = get_reply_content(el);
      var titleEl = responseEl.siblings(".title");

      $(".popover").remove();

      if (responseEl.length) {
        e.preventDefault();
      }
      if (titleEl.length) {
        div.prepend(titleEl.clone());
      }
      var div = $("<div />");
      div.append(responseEl.children());
      
      return div;
    }

    function expand_replies(div, depth) {
      var replylinks = div.find(".replylink");
      depth = depth || 0;
      var border;
      if (replylinks.length > 1) {
        depth += 1;
        border = "1px dotted #ddd";
      }

      replylinks.each(function() {
        var responseEl = get_reply_content(this);
        expand_replies(responseEl, depth);
        var wrapper = $("<div />");
        wrapper.css({ borderLeft: border, paddingLeft: depth * 4 + "px" });
        wrapper.append(responseEl.children());

        div.prepend(wrapper);
      });
    }

    var div = buildreply_popup(e.target);
    var el = e.target;
    expand_replies(div);
    $(el).popover({ html: true, content: div.html(), placement: "top", container: container });
    _.defer(function() { 
      $(el).popover("show");
    });


  },

  handle_mouseleave_replylink: function(e) {
    $(e.target).popover("destroy");
    $(".popover").remove();
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
  handle_click_help: function() {
    $C("markdown_dialog", {});
  },
  collapse: function() {
    this.$el.find(".post").removeClass("maximize");
    this.$el.find(".infobar .restore").html("[expand]");
    this.bumped();
  },
  expand: function() {
    this.$el.find(".post").addClass("maximize");
    this.$el.find(".infobar .restore").html("[collapse]");
    this.bumped();

  },
  handle_restore: function(e) {
    var current_max = this.$el.find(".post").hasClass("maximize");
    if (current_max) {
      this.collapse();
    } else {
      this.expand();
    }

    e.preventDefault();
  },

  handle_maybe_submit: function(e) {
    if (e.keyCode === 13 && !e.shiftKey) {
      this.handle_reply(e);
      return true;
    }

  },

  update_reply_preview: function() {
    // Update our preview with markdwon, too
    var replyInput = this.$el.find(".reply textarea");
    var reply = replyInput.val().trim();
    var escaped_reply = $("<div />").text(reply).html();

    // Save escaped_reply to localStorage until we clear it
    if (escaped_reply) {
      window.bootloader.storage.set("reply" + this.get_post_id(), reply);
    } else {
      window.bootloader.storage.delete("reply" + this.get_post_id());
    }

    var replyPreview = this.$el.find(".replypreview");
    if (replyPreview.is(":visible")) {
      replyPreview.empty();
      var replyContainer = $("<div />");
      replyContainer.text(escaped_reply);
      this.helpers['app/client/text'].format_text(replyContainer);
      replyPreview.append(replyContainer);
    }


  },

  // Alright. so we rely on users updating their socket status.  any one socket
  // can either be: 1. doing nothing, 2. typing a reply, 3. watching a post
  handle_typing: _.throttle(function() {

    SF.socket().emit("isdoing", { what: "typing", post_id: this.get_post_id()});

    this.update_reply_preview();

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
    this.update_reply_preview();
  },

  handle_reply: function(e) {
    e.preventDefault();
    var replyInput = this.$el.find(".reply textarea");
    var replyPreview = this.$el.find(".replypreview");
    var reply = replyInput.val();

    if (reply.trim() === "") {
      return;
    }

    var tokens = reply.split(" ");
    var first_word = tokens[0];
    var postId = this.get_post_id();
    if (CLIENT_COMMANDS[first_word]) {
      CLIENT_COMMANDS[first_word].apply(this, tokens);
      replyInput.val("");
      return;
    }



    var author = SF.controller().get_handle();
    var tripcode = SF.controller().get_tripcode();
    var triphash = SF.controller().get_triphash();

    // should input the preview / half sent version here
    var data = {
        post_id: postId,
        author: author,
        tripcode: triphash,
        text: reply
    };



    var replyEl, received;
    var self = this;

    setTimeout(function() {
      if (!received) {
        data.post_id = _.uniqueId("pending");
        data.tripcode = SF.controller().get_trip_identity();
        replyEl = self.add_reply_preview(data);
        replyEl.addClass("desaturate");
      }
    }, 400);

    data.post_id = postId;
    SF.socket().emit("new_reply", data, function() {
      // Success or not...
      replyInput.val("");
      replyPreview.text("");
      received = true;
      window.bootloader.storage.delete("reply" + postId);
      SF.controller().remember_tripcode(author, tripcode);
      if (replyEl) {
        replyEl.slideUp();
      }

    });

  },

  handle_template_click: function() {
    this.handle_focus();
  },

  handle_upboat_link: function(e) {
    // handles clicking inline upboats
    var a = $(e.target);
    var href = a.data('href');
    var text = a.data("text");
    var new_text = $("<div />").html(text);

    // stupid junk for handling icons in links... and re-replacing with :icon:
    var icons = new_text.find("i.icon");
    _.each(icons, function(icon) {
      var iconclass = $(icon).attr("class").replace("icon icon-", "");
      $(icon).text(":" + iconclass + ":");
    });

    text = new_text.text();

    var reply = a.closest(".reply");
    var post = a.closest(".post");

    var post_id;
    if (reply.length) {
      post_id = reply.attr("id").replace(/reply/g, "");
    } else if (post.length) {
      post_id = post.data("post-id");
    }

      

    SF.socket().emit("upboat", {
      href: href,
      title: text,
      post_id: post_id
    }, function() {
      a.fadeOut(function() {
        a.removeClass("icon-arrow");
        a.addClass("icon-coffee");
        a.removeClass("upboat");
        a.fadeIn();
      });
    });
  }

};
