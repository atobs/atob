"use strict";

// http://stackoverflow.com/a/10075654/442652
function padDigits(number, digits) {
  return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
}

function get_colors_for_hash(hashed) {
  hashed = hashed || window.md5(hashed);
  var colors = hashed.match(/([\dABCDEF]{6})/ig);

  var hexes = [];
  for (var i = 0; i < 4; i++) {
    var color = parseInt(colors[i], 16);
    var red = (color >> 16) & 255;
    var green = (color >> 8) & 255;
    var blue = color & 255;
    var hex = $.map([red, green, blue], function(c, i) {
      return padDigits(((c >> 4) * 0x10).toString(16), 2);
    }).join('');

    hexes.push(hex);
  }

  return hexes;
}

function gen_tripcode(el) {
  // Now that we have our tripcodes, do other things...
  var colors = get_colors_for_hash($(el).data("tripcode"));
  var div = $(el);
  _.each(colors, function(color) {
    var colorDiv = $("<div />").css({
      backgroundColor: "#" + color,
      display: "inline-block",
      height: "20px",
      width: "25%"
    });
    div.append(colorDiv);

    $(el).css({
      position: "relative"
    });
  });
}

function add_icons($el) {
  var escaped = $el.text();
  if (escaped) {
    var icon_str = "<i class='icon icon-NAME' title=':NAME:' />";
    var replaced = escaped.replace(/:([\w-]+):/g, function(x, icon) {
      return icon_str.replace(/NAME/g, icon.toLowerCase());
    });
    $el.html(replaced);
  }
}

module.exports = {
  tagName: "div",
  className: "",
  defaults: {
    content: "default content"
  },
  get_post_id: function() { return this.$el.find(".post").data("post-id"); },
  initialize: function() { },
  client: function(options) {
    var POSTS = window._POSTS || {};
    window._POSTS = POSTS;
    POSTS[options.post_id] = this; 

    // need to find the icons in the text and fix them
    var textEl = this.$el.find(".text");

    textEl.each(function() {
      add_icons($(this));
    });


    var repliesEl = this.$el.find(".replies");
    this.$el.find(".collapse").on("shown.bs.collapse", function() {
      repliesEl.animate({scrollTop: repliesEl[0].scrollHeight});
    });

    this.$el.find(".post").fadeIn();
    this.$el.find("div.tripcode").each(function() {
      gen_tripcode(this);
    });
  },
  add_reply: function(data) {
    var replyEl =$("<div class='ptl pbl'/>");
    var tripEl = $("<div class='tripcode' />")
      .data("tripcode", data.tripcode)
      .attr("title", data.author);

    tripEl.css("marginRight", "8px");
    gen_tripcode(tripEl);

    replyEl.append(tripEl);
    var infoEl = $("<a href='#' class='mrm' style='margin-right: 5px' >");
    infoEl.html("#" + data.post_id);
    infoEl.attr("title", (new Date(data.created_at)).toLocaleString());
    replyEl.append(infoEl);
    replyEl.append($("<b />").text(data.title));

    // need to find the icons in the text and fix them
    var smallEl = $("<small />").text(data.text);
    add_icons(smallEl);

    replyEl.append(smallEl);
    replyEl.fadeIn();

    var repliesEl = this.$el.find(".replies");
    repliesEl.append(replyEl).scrollTop(repliesEl[0].scrollHeight);

    var replies = parseInt(this.$el.find(".reply_count").html() || "0", 10);
    this.$el.find(".reply_count").text(replies + 1);

  },
  update_counts: function(counts) {
    counts.sort();
    var str = _.map(counts, function(c) { return c[0]; });
    this.$el.find(".counts").text(str.join(""));
    // Update who is typing, who is idle and who is gone.
  },

};
