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

      // this is where we should verify its a title?
      var titleParent = $(el).closest(".title");
      if (titleParent.length) {
        var link = $(el).find("a");

        _.each(link, function(link) {
          var linkEl = $(link);
          var text = linkEl.text();
          linkEl.text("[link]");
          linkEl.addClass("titlelink");
          linkEl.before(text.replace(/\[link\]/g, ' '));
        });

      }
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
    require("app/client/emojies", function(emojies) {
      emojies.add_textcomplete(replyInput);
    });

    self.$el.find(".timeago").timeago();

    self.setup_polls();

    require("app/client/sinners", function(sinners) {
      sinners.check_reply(self.$el, options.tripcode);
    });

    // make sure this post starts with the right value of sizing for the board
    require("app/client/storage", function(storage) {
      var boardstyle = storage.get("boardstyle") || "";

      if (self.$el.find(".post").hasClass("maximize")) {
        return;
      }

      self.$el.find(".post").addClass(boardstyle);
      SF.trigger("set_boardstyle", boardstyle);

    });

    
    // TODO: better queueing
    _.defer(function() {
      $(".loading").remove();
      self.$el.find(".post").show();
      self.bumped(); 
      SF.trigger("post" + options.post_id);
    });

    _.defer(function() {
      var socket = SF.socket();
      if (!socket) {
        SF.once("bridge/socket", function(socket) {
          socket.emit("join", options.board_id);
        });
      } else {
        SF.socket().emit("join", options.board_id);
      }
    });
  },

  bumped: function(animate) {
    var repliesEl = this.$el.find(".replies");
    if (animate) {
      repliesEl.animate({ scrollTop: repliesEl[0].scrollHeight});
    } else {
      repliesEl.scrollTop(repliesEl[0].scrollHeight);
    }
  },

  add_reply_preview: function(data) {
    // alright... let's see..
    var replyId = "reply" + data.post_id;
    if ($("#" + replyId).length) {
      $("#" + replyId).remove();
    }

    this.add_reply(data, true);

    var replyEl = $("#" + replyId);
    return replyEl;
  },

  add_reply: function(data, dontpulse) {
   
    if (!dontpulse) {
      this.$el.find(".post").addClass("pulse");
    }

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

    require("app/client/sinners", function(sinners) {
      sinners.check_reply(replyEl, data.tripcode);
    });
    replyEl.fadeIn();


    var repliesEl = this.$el.find(".replies");
    repliesEl.append(replyEl);
    this.bumped(true);

    process_vote(replyEl);

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
      u: "icon-glassesalt",
      s: "icon-ghost hue"
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
  },

  setup_polls: function() {
    var orderedLists = this.$el.find("ol");
    if (orderedLists.length) {
      orderedLists.each(function() {
        var $el = $(this);
        var parentReply = $el.closest(".reply");

        var replyId = parentReply.attr("id").replace(/reply/, '');

        var repliesTo = $(".replylink[data-parent-id=" + replyId + "]");
        repliesTo.each(function() {
          process_vote($(this));
        });
      });
    }


  }

};

function process_vote(replyEl) {

  var replylink = replyEl.closest(".reply").find(".replylink");
  var orderedListId = replylink.data("parent-id");
  var orderedList = replylink.closest(".post").find("#reply" + orderedListId);

  var text = replylink.closest(".text").data("text");

  if (!text) {
    return;
  }

  var this_votes = {};
  // we allow cross votes, but only one per reply
  var matches = text.match(/:?vote-?\d+:?/g);

  _.each(matches, function(match) {
    var vote = match.replace(/vote-?/, "").replace(/:/g, "");
    vote = parseInt(vote, 10);
    this_votes[vote] = true;
  });

  _.each(this_votes, function(v, key) {
    var lis = orderedList.find("li");
    var votedon = lis.get(key - 1); // because the list starts at 1, duh


    if (!votedon) {
      return;
    }

    // now, we need to add the voter at the end of the li
    var vote_span = $(votedon).find(".votes");
    var prev_value = 0;
    if (!vote_span.length) {
      vote_span = $("<span class='votes' />");
      $(votedon).prepend(vote_span);
    } else {
      prev_value = parseInt(vote_span.html(), 10);
    }

    var count = prev_value + 1;
    vote_span.html(count);
  });
}
