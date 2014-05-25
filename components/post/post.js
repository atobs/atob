"use strict";

function async_loop(items, func, timeout) {
  var index = 0;
  var start = Date.now();
  timeout = timeout || 50;

  var last_items = 2;
  for (var i = 0; i < last_items; i++) {
    var last = items.pop();
    if (last) {
      func(last);
    }
  }

  function async_func() {
    while (index < items.length) {
      func(items[index]);
      index += 1;

      if (Date.now() - start > timeout) {
        setTimeout(async_func);
        break;
      }
    }
  }

  return async_func;

}

var REPLY_TEXT = {};
module.exports = {
  tagName: "div",
  className: "",
  defaults: {
    content: "default content"
  },
  get_post_id: function() { return this.$el.find(".post").data("post-id"); },
  initialize: function() { },
  collapse: function() {
    this.$el.find(".cpost").collapse("hide");
  },
  expand: function() {
    this.$el.find(".collapse").collapse("show");
  },
  add_markdown: function(text_formatter) {
    if (!text_formatter) {
      text_formatter = this.helpers["app/client/text"];
    }
    var textEl = this.$el.find(".text");
    _.each(textEl, function(el) {
      text_formatter.format_text($(el));
    });
  },
  gen_tripcodes: function(tripcode_gen) {
    if (!tripcode_gen) {
      tripcode_gen = this.helpers["app/client/tripcode"].gen_tripcode;
    }
    var tripcodes = this.$el.find("div.tripcode");

    _.each(tripcodes, function(el) {
      tripcode_gen(el);
    });
  },
  client: function(options) {
    var POSTS = window._POSTS || {};
    var self = this;
    window._POSTS = POSTS;
    window._REPLIES = REPLY_TEXT;
    POSTS[options.post_id] = this;


    REPLY_TEXT[options.post_id] = options;

    _.each(options.replies, function(reply) {
      REPLY_TEXT[reply.id] = reply;
    });


    var replyInput = this.$el.find(".reply textarea");
    var text = window.bootloader.storage.get("reply" + this.get_post_id());
    replyInput.val(text);

    self.$el.find(".timeago").timeago();

    self.init_tripcodes();

    self.$el.find(".post").show();
    _.defer(function() { self.bumped(); });
    SF.trigger("post" + options.post_id);
  },

  init_tripcodes: function() {
    var self = this;
  },
  bumped: function() {
    var repliesEl = this.$el.find(".replies");
    repliesEl.animate({ scrollTop: repliesEl[0].scrollHeight});
  },
  add_reply: function(data) {
    this.$el.find(".post").addClass("pulse");

    var replyId = "reply" + data.post_id;
    if ($("#" + replyId).length) {
      return;
    }

    REPLY_TEXT[data.post_id] = data;

    var replyEl =$("<div class='pam reply'/>");
    replyEl.attr("id", replyId);
    var tripEl = $("<div class='tripcode' />")
      .data("tripcode", data.tripcode)
      .attr("title", "anon");

    tripEl.css("marginRight", "8px");
    this.helpers['app/client/tripcode'].gen_tripcode(tripEl);

    replyEl.append(tripEl);

    var infoEl = $("<a class='rfloat addreply' >");
    infoEl.attr("href", "/p/" + data.post_id);
    infoEl.html(data.post_id);
    infoEl.attr("data-parent-id", data.post_id);
    infoEl.attr("title", (new Date(data.created_at)).toLocaleString());
    replyEl.append($("<small />").append(infoEl));

    var deleteEl = $("<a class='deletereply icon-edit' href='#' />");
    deleteEl.attr("data-parent-id", data.post_id);
    replyEl.append(deleteEl);

    var titleEl = $("<b />").text(data.title);
    this.helpers['app/client/text'].format_text(titleEl);
    replyEl.append(titleEl);

    // need to find the icons in the text and fix them
    var smallEl = $("<small class='text'/>").text(data.text);
    replyEl.append(smallEl);

    this.helpers['app/client/text'].format_text(smallEl);

    replyEl.fadeIn();

    var repliesEl = this.$el.find(".replies");
    repliesEl.append(replyEl);
    this.bumped();

    var timeagoEl = this.$el.find(".last_reply .timeago");
    timeagoEl.attr("title", Date.now());
    timeagoEl.html($.timeago(Date.now()));

    var replies = parseInt(this.$el.find(".reply_count").html() || "0", 10);
    this.$el.find(".reply_count").text(replies + 1);
    if (repliesEl.children().length > 6) {
      this.$el.find(".restore").show();
    }

    if (data.up) {
      var ups = parseInt(this.$el.find(".ups_count").html() || "0", 10);
      this.$el.find(".ups_count").text(ups + 1);
      this.$el.find(".ups").removeClass("hidden");
    }

    if (data.down) {
      var downs = parseInt(this.$el.find(".downs_count").html() || "0", 10);
      this.$el.find(".downs_count").text(downs + 1);
      this.$el.find(".downs").removeClass("hidden");
    }
  },
  update_counts: function(counts) {
    counts.sort();

    var lookup = {
      t: "icon-keyboardalt",
      f: "icon-glassesalt",
      u: "icon-glassesalt"
    };

    var str = _.map(counts, function(c) {
      return "<i class='" + (lookup[c[0]] || "icon-" + c.replace(/:/g, "")) + "' />";
    });

    // Update who is typing, who is idle and who is gone.
    this.$el.find(".counts").html(str.join(" "));
  },

  shake: function(duration) {
    duration = duration || 400;
    var textarea = this.$el.find("textarea");

    textarea.animate({
      opacity: 0.4
    });

    setTimeout(function() {
      textarea.animate({
        opacity: 1
      });
    }, duration);
  }

};
