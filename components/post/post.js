function get_colors_for_hash(tripcode) {
  var hashed = md5(tripcode);
  var colors = hashed.match(/([\dABCDEF]{6})/ig);

  console.log("HASHED IS", hashed);

  var hexes = [];
  for (var i = 0; i < 4; i++) {
    var color = parseInt(colors[i], 16);
    var red = (color >> 16) & 255;
    var green = (color >> 8) & 255;
    var blue = color & 255;
    var hex = $.map([red, green, blue], function(c, i) {
      return ((c >> 4) * 0x10).toString(16);
    }).join('');

    hexes.push(hex);
  }

  return hexes;
}
module.exports = {
  tagName: "div",
  className: "",
  defaults: {
    content: "default content"
  },
  initialize: function() { },
  client: function(options) {
    var client_options = options.client_options;

    if (options.replies && options.replies.length) {
      console.log("Has replies", options.replies);
    }
    this.$el.find("span.tripcode").each(function() {
      console.log("Initializing tripcode", $(this).data("tripcode"));
    });
  }
};
