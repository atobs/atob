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

module.exports = {
  tagName: "div",
  className: "",
  defaults: {
    content: "default content"
  },
  initialize: function(data) { 
    if (data.replies && data.replies.length) {
      data.replies = _.sortBy(data.replies, function(d) { return -d.created_at; });
    }
  },
  client: function(options) {
    var POSTS = window._POSTS || {};
    window._POSTS = POSTS;
    POSTS[options.post_id] = this; 
    this.$el.find("div.tripcode").each(function() {
      gen_tripcode(this);
    });
  },
  add_reply: function(data) {
    console.log("Adding reply...", data);
    var replyEl =$("<div />");
    var tripEl = $("<div class='tripcode' />").data("tripcode", data.tripcode);
    gen_tripcode(tripEl);

    replyEl.append(tripEl);
    replyEl.append($("<b />").html(data.title));
    replyEl.append($("<small />").html(data.text));

    this.$el.find(".replies").append(replyEl);
  }
};
