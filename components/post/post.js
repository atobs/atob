// http://stackoverflow.com/a/10075654/442652
function padDigits(number, digits) {
  return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
}


function get_colors_for_hash(hashed) {
  hashed = hashed || md5(hashed);
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
module.exports = {
  tagName: "div",
  className: "",
  defaults: {
    content: "default content"
  },
  initialize: function() { },
  client: function(options) {
    this.$el.find("div.tripcode").each(function() {
      // Now that we have our tripcodes, do other things...
      var colors = get_colors_for_hash($(this).data("tripcode"));
      var div = $(this);
      _.each(colors, function(color) {
        var colorDiv = $("<div />").css({
          backgroundColor: "#" + color,
          display: "inline-block",
          height: "20px",
          width: "25%"
        });
        div.append(colorDiv);

        $(this).css({
          position: "relative"
        });
      });
    });
  }
};
