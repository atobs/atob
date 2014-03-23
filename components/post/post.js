"use strict";

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
  client: function(options) {
    var POSTS = window._POSTS || {};
    var self = this;
    window._POSTS = POSTS;
    POSTS[options.post_id] = this; 

    // need to find the icons in the text and fix them
    var textEl = this.$el.find(".text");

    textEl.each(function() {
      self.helpers['app/client/text'].format_text($(this));
    });


    self.$el.find(".timeago").timeago();
    self.$el.find(".post").fadeIn(function() {
      self.bumped(); 
    });
    self.$el.find("div.tripcode").each(function() {
      self.helpers['app/client/tripcode'].gen_tripcode(this);
    });
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

    var replyEl =$("<div class='pam reply'/>");
    replyEl.attr("id", replyId);
    var tripEl = $("<div class='tripcode' />")
      .data("tripcode", data.tripcode)
      .attr("title", data.author);

    tripEl.css("marginRight", "8px");
    this.helpers['app/client/tripcode'].gen_tripcode(tripEl);

    replyEl.append(tripEl);

    var infoEl = $("<a href='#' class='rfloat' style='' >");
    infoEl.html("#" + data.post_id);
    infoEl.attr("title", (new Date(data.created_at)).toLocaleString());
    replyEl.append($("<small />").append(infoEl));
    var titleEl = $("<b />").text(data.title);
    this.helpers['app/client/text'].format_text(titleEl);
    replyEl.append(titleEl);

    // need to find the icons in the text and fix them
    var smallEl = $("<small />").text(data.text);
    this.helpers['app/client/text'].format_text(smallEl);

    replyEl.append(smallEl);
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
  },
  update_counts: function(counts) {
    counts.sort();
    var str = _.map(counts, function(c) { return c[0]; });
    this.$el.find(".counts").text(str.join(""));
    // Update who is typing, who is idle and who is gone.
  },

};
