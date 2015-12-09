"use strict";

var JOINED = {};
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

// make a list of last seen IDs per post
// then, whenever you have a 'last seen' ID
// you can turn the thread into the two parter
function collapse_threads($el, lastSeenId) {
  var depths = {};

  if (!lastSeenId) {
    lastSeenId = 0;
  }

  var replyMap = {};
  var replylinks = $el.find(".replylink, .oplink");
  _.each(replylinks, function(r) {
    var parentId = $(r).data("parent-id");
    if (!replyMap[parentId]) {
      replyMap[parentId] = [];
    }

    replyMap[parentId].push(r);
  });

  function collapse_reply(replyEl, replyId) {
    // Look for replylinks, right?
    if (replyEl.data("visited")) {
      return;
    }

    replyEl.data("visited", true);

    var repliesTo = replyMap[replyId] || [];

    var threaded = [];
    var unthreaded = [];

    _.each(repliesTo, function(r) {
      var cloneId = $(r).closest(".reply").attr("id");
      var nested = !!$(r).closest(".nest").length;
      if (!cloneId || nested) {
        return;
      }

      cloneId = cloneId.replace(/reply/, "");
      if (parseInt(cloneId, 10) <= lastSeenId || !lastSeenId) {
        threaded.push(r);
      } else {
        unthreaded.push(r);
      }
    });

    if (threaded.length) {
      var nestEl = replyEl.children(".nest");
      if (!nestEl.length) {
        nestEl = $("<div class='nest' />");
        replyEl.append(nestEl);
      }

      if (repliesTo.length > 1) {
        nestEl.addClass("many");

      }

      _.each(threaded, function(el) {
        var parEl = $(el).closest(".reply");
        if (parEl.data("visited")) {
          return;
        }

        var cloneEl = parEl;
        var depth = depths[replyId] || 1;
        var cloneId = cloneEl.attr("id");
        if (!cloneId) {
          return;
        }

        cloneId = cloneId.replace(/reply/, "");
        depths[cloneId] = depth + 1;

        collapse_reply(cloneEl, cloneId);

        nestEl.append(cloneEl);

      });
    }
  }

  var replies = $el.find(".reply");
  _.each(replies, function(r) {

    var thisEl = $(r);
    var thisId = thisEl.attr("id");

    if (!thisId) {
      return;
    }


    thisId = thisId.replace(/reply/, "");

    // Over here, we need to either append this reply to teh end (its greater than lastSeen)
    // or put it in its right place...
    collapse_reply(thisEl, thisId);
  });

}

function replace_oplinks(el) {
  el.find(".tripcode.oplink").each(function() {
    var child = $(this);
    var opid = child.attr("data-parent-id");
    var parentEl = $("#reply" + opid);



    var tripcode;

    function gen_tripcode() {
      child.removeClass("desaturate");
      window.gen_tripcode(child);

      if (tripcode) {
        child.data("tripcode", tripcode);
        child.attr("data-tripcode", tripcode);
        require("app/client/sinners", function(sinners) {
          sinners.check_reply(child, tripcode);
        });

      }


    }

    if (parentEl.length) {
      tripcode = parentEl.find(".tripcode").data("tripcode");
      if (!tripcode) {
        parentEl = parentEl.siblings(".title");
        tripcode = parentEl.find(".tripcode").data("tripcode");
      }

      child.data("tripcode", tripcode);
      gen_tripcode();

      return;
    }

    // if we couldn't find the tripcode, we have to go to the server and look it up
    function replace_tripcode(socket) {
      socket.emit("get_post_only", opid, function(post_data) {
        if (!post_data) {
          return gen_tripcode();
        }

        tripcode = post_data.tripcode;
        child.data("tripcode", tripcode);
        gen_tripcode();
      });
    }

    var socket = SF.socket();
    if (!socket) {
      SF.once("bridge/socket", function(socket) { replace_tripcode(socket); });
    } else {
      replace_tripcode(socket);
    }

  });

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
    var cache = module.exports.add_markdown.cache = module.exports.add_markdown.cache || {};
    _.each(textEl, function(el) {
      var cache_key = md5($(el).html());

      if (cache[cache_key]) {
        $(el).attr("data-text", $(el).text());
        $(el).html(cache[cache_key].html);
        $(el).addClass(cache[cache_key].classes);
      } else {
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

        // annoyingly, we have to cache multiple parts...
        cache[cache_key] = {
          html: $(el).html(),
          classes: $(el).attr("class")
        };
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

  update_spacer_text: function(last_seen, insert_before) {
    var prevReply;
    var replyContainer = this.$el.find(".replies");
    _.each(this.$el.find(".reply"), function(r) {
      var id = $(r).attr("id");
      id = (id || 0) && parseInt(id.replace(/reply/, ""), 10);
      if (id && id <= last_seen) {
        prevReply = r;
      }
    });


    var spacerDiv = this.make_spacer_div();
    if ($(prevReply).length) {
      var parents = $(prevReply).parents(".reply");
      var lastParent = _.last(parents, 1);

      if (!parents.length) {
        parents = parents.add(prevReply.closest(".reply"));
        lastParent = prevReply.closest(".reply");
      }


      if (!parents.length) {
        return;
      }

      if (insert_before) {
        $(lastParent).before(spacerDiv);
      } else {
        $(lastParent).after(spacerDiv);

      }
    }

  },
  scroll_to_spacer: _.throttle(function(amount) {
    var current_max = this.$el.find(".post").hasClass("maximize");
    var spacerDiv = this.make_spacer_div();
    spacerDiv.finish().fadeIn();
    var container = this.$el.find(".replies");
    var scrollTop = 0;
    if (current_max) {
      container = $(window);
      scrollTop = amount || -400;
    }

    container.finish().scrollTo(spacerDiv, 500, {
      offset: {
        top: scrollTop
      },
      duration: 100,
      interrupt: true
    });
  }, 50),
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


    if (window.bootloader.storage.get("filtercontent") === "true") {
      require("app/client/profanity", function(clean_element) {
        clean_element(self.$el);
      });
    }

    var replyInput = this.$el.find(".replyform textarea");
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
      if (!JOINED[options.board_id]) {
        var socket = SF.socket();
        if (!socket) {
          SF.once("bridge/socket", function(socket) {
            socket.emit("join", options.board_id);
          });
        } else {
          SF.socket().emit("join", options.board_id);
        }

        JOINED[options.board_id] = true;
      }
    });

    replace_oplinks(this.$el);

    if (window.bootloader.storage.get("threadify") === "true" && options.threading) {
      var last_seen = self.get_last_seen();

      self.collapse_threads(last_seen);
      self.update_spacer_text(last_seen);
      self.scroll_to_spacer();

    }
  },

  save_last_seen: function() {
    var repls = this.options.client_options.replies;
    var last_seen = 0;
    if (!this.last_seen) {
      this.last_seen = [];
    }

    if (repls.length) {
      last_seen = repls[repls.length-1].id;
    } 

    if (!_.contains(this.last_seen, last_seen)) {
      this.last_seen.push(last_seen);
    }

    window.bootloader.storage.set("lastseen:" + this.options.client_options.post_id, JSON.stringify(this.last_seen));
  },

  get_last_seen: function() {
    // check if we should collapse threads...
    var last_seen = window.bootloader.storage.get("lastseen:" + this.options.client_options.post_id);
    if (last_seen) {
      try {
        last_seen = JSON.parse(last_seen);
      } catch(e) { }
      if (_.isArray(last_seen)) {
        this.last_seen = last_seen;
        this.last_seen_id = last_seen[last_seen.length-1];
      } else if (_.isNumber(last_seen)) {
        this.last_seen = [last_seen];
        this.last_seen_id = last_seen;
      }

    }

    if (!this.last_seen) {
      this.last_seen = [];
    }

    last_seen = last_seen || -1;


    return this.last_seen_id;

  },

  set_last_seen: function(id) {
    this.get_last_seen();
    this.last_seen_id = id;
    var self = this;

    if (!_.contains(this.last_seen, id)) {
      self.last_seen.push(id);
    }
  },

  thread_back: function() {
    var closestHistoryBefore;
    var self = this;
    _.each(this.last_seen, function(id) {
      if (id >= self.cur_seen_id) {
        return;
      }

      closestHistoryBefore = id;
    });

    if (closestHistoryBefore) {

      this.collapse_threads(closestHistoryBefore);
      this.update_spacer_text(closestHistoryBefore);
      this.scroll_to_spacer();

      return;
    } 

    // look through our replies and then go forward and backwards

    // so... now we find the thread id before this one
    var opts = this.options.client_options;
    var newId = opts.replies[0];
    this.collapse_threads(newId.id);
    this.update_spacer_text(newId.id, true);

    this.scroll_to_spacer();
  },

  thread_forward: function() {
    var closestHistoryAfter;
    var self = this;
    _.each(this.last_seen, function(id) {
      if (closestHistoryAfter || id <= self.cur_seen_id) {
        return;
      }

      closestHistoryAfter = id;
    });

    if (closestHistoryAfter) {

      this.collapse_threads(closestHistoryAfter);
      this.update_spacer_text(closestHistoryAfter);
      this.scroll_to_spacer();

      return;
    } 
    
    // look through our replies and then go forward and backwards

    // so... now we find the thread id before this one
    var opts = this.options.client_options;
    var indexOf = _.indexOf(opts.replies, window._REPLIES[this.cur_seen_id]);
    if (indexOf === -1) {
      // the reply has gone missing, find the next closest...
      var closestReplyId;
      var closestReplyIndex;
      _.each(opts.replies, function(r, index) {
        if (r.id > self.cur_seen_id) {
          return;
        }
        closestReplyId = r.id;
        closestReplyIndex = index;
      });
      indexOf = closestReplyIndex || -1;

    }
    var newId = opts.replies[Math.min(opts.replies.length-1, indexOf + 5)];
    this.collapse_threads(newId.id);
    this.update_spacer_text(newId.id);
    this.scroll_to_spacer();
  },

  collapse_threads: function(last_seen) {
    var self = this;
    var swappedArea = $("<div />");
    if (!last_seen || last_seen === -1) {
      (function() {
        var repls = self.options.client_options.replies;
        last_seen = 0;
        if (repls.length) {
          last_seen = repls[repls.length-1].id;
        } 
      })();
    }

    this.cur_seen_id = last_seen;

    $(".reply").data("visited", false);
    var replies = this.$el.find(".reply");
    replies = _.sortBy(replies, function(r) {
      var id = $(r).attr("id");
      return id && parseInt(id.replace(/reply/, ""), 10);
    });

    var replyContainer = this.$el.find(".replies");
    var prevReply;
    _.each(replies, function(r) {
      swappedArea.append(r);

    });

    collapse_threads(swappedArea, last_seen);

    replyContainer.empty();
    replyContainer.append(swappedArea.children());

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

  make_reply_el: function(data) {

    var replyId = "reply" + data.post_id;
    if ($("#" + replyId).length) {
      return;
    }

    REPLY_TEXT[data.post_id] = data;

    var replyEl =$("<div class='reply clearfix'/>");
    replyEl.attr("id", replyId);
    var tripEl = $("<div class='tripcode' />")
      .data("tripcode", data.tripcode);

    tripEl.css("marginRight", "8px");
    this.helpers['app/client/tripcode'].gen_tripcode(tripEl);

    replyEl.append(tripEl);

    var deleteEl = $("<a class='deletereply ' href='#' ><i class='icon-edit'> </i> </a>");
    deleteEl.attr("data-parent-id", data.post_id);
    replyEl.append(deleteEl);

    var infoEl = $("<a class='rfloat addreply' >");
    infoEl.attr("href", "/p/" + data.post_id);
    infoEl.html(data.post_id);
    infoEl.attr("data-parent-id", data.post_id);
    infoEl.attr("title", (new Date(data.created_at)).toLocaleString());
    replyEl.append($("<small />").append(infoEl));

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

    return replyEl;
  },

  make_spacer_div: function() {
    if (window.bootloader.storage.get("threadify") !== "true" || !this.options.client_options.threading) {
      return $("<div />");
    }

    var self = this;
    if (!self) {
      return $("<div />");
    }
    var spacerDiv = self.$el.find(".newreplyspacer");
    var replies = !!self.$el.find(".reply").length;
    if (!replies || replies.length < 5) {
      return $("<div />");
    }

    if (!spacerDiv.length) {
      spacerDiv = $("<div class='reply newreplyspacer clearfix pal' />");
      var controlDiv = $("<div class='history controls spacertext' />");
      controlDiv.append($("<div class='history back icon-arrow-up'/>"));
      controlDiv.append($("<div class='history forward icon-arrow-down'/>"));
      spacerDiv.append(controlDiv);

      spacerDiv.attr("title", "new replies go under here");
      self.$el.find(".replies")
        .append(spacerDiv);
    }

    return spacerDiv;
  },

  add_reply: function(data, dontpulse) {

    if (!dontpulse) {
      this.$el.find(".post").addClass("pulsepost");
    }

    this.make_spacer_div();
    var replyEl = this.make_reply_el(data);



    var repliesEl = this.$el.find(".replies");
    repliesEl.append(replyEl);
    this.bumped(true);

    this.set_last_seen(data.post_id);

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

    replace_oplinks(replyEl);
  },
  is_starred: function() {
    return this.starred;

  },
  replace_oplinks: replace_oplinks,
  unstar: function() {
    this.starred = false;
    this.$el.find(".post")
    .css("border-color", this.old_border_color);
  },
  star: function() {
    this.starred = true;

    if (!this.old_border_color) {
      this.old_border_color = this.$el.find(".post").css("border-color");
      this.old_border_width = this.$el.find(".post").css("border-width");
    }
    var post = this.$el.find(".post");

    post.css("border-color", "gold");

    this.bumped();
    var parent = this.$el.closest(".posts");
    parent.prepend(this.$el);
  },
  burtle: function(burtles) {
    this.$el.find(".burtles_count").text(burtles);
    this.$el.find(".burtles").removeClass("hidden");
  },
  update_counts: function(counts) {
    counts.sort();

    var lookup = {
      t: "icon-keyboardalt",
      f: "icon-glassesalt",
      u: "icon-glassesalt",
      s: "icon-ghost hue"
    };

    var get_anonicator_for = this.helpers['app/client/anonications'].get_anonicator_for;

    var str = _.map(counts, function(c) {
      return "<i class='" + get_anonicator_for(c) + "' />";
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
  be_discreet: function() {

    // blend the post into the page...

    $(this.$el.find(".title")[0]).css("display", "none");
    $(this.$el.find(".post")[0]).css({
      "background-color": "inherit",
      border: "none",
      padding: "0px"
    });
    $(this.$el.find(".many")[0]).removeClass("col-md-12");
    _.each(this.$el.find(".op"), function(el) {
      $(el).css("display", "none");
    });

  },

  setup_polls: function() {
    var orderedLists = this.$el.find("ol");
    if (orderedLists.length) {
      orderedLists.each(function() {
        var $el = $(this);
        var parentReply = $el.closest(".reply");

        var replyId;
        if (!parentReply.length) {
          parentReply = $el.closest(".post");
          replyId = parentReply.data("post-id");
        } else {
          replyId = (parentReply.attr("id") || "").replace(/reply/, '');
        }

        if (!replyId){
          return;
        }

        var repliesTo = $(".replylink[data-parent-id=" + replyId + "]");
        repliesTo.each(function() {
          process_vote($(this));
        });
      });
    }


  }

};


var voted = {};
function process_vote(replyEl) {

  var replylink = replyEl.closest(".reply").find(".replylink");
  var replyId = (replyEl.closest(".reply").attr("id") || "").replace(/reply/, "");

  var orderedListId = replylink.data("parent-id");
  var orderedList = replylink.closest(".post").find("#reply" + orderedListId);

  var text = replylink.closest(".text").data("text");

  if (!text) {
    return;
  }

  var this_votes = {};
  // we allow cross votes, but only one per reply
  if (!voted[replyId]) {
    voted[replyId] = {};
  }

  var matches = text.match(/:?vote[- ]?\d+:?/g);

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

    if (voted[replyId][key]) {
      return;
    }
    voted[replyId][key] = true;


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
