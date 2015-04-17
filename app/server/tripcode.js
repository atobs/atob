// WARNING: this file is duplicatesing code with app/client/tripcode. be careful

// http://stackoverflow.com/a/10075654/442652
function padDigits(number, digits) {
  return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
}

var md5 = require_app("server/md5");
function get_colors_for_hash(hashed) {
  hashed = hashed || md5(hashed);
  var colors = hashed.match(/([\dABCDEF]{6})/ig);

  var hexes = [];
  for (var i = 0; i < 4; i++) {
    var color = parseInt(colors[i], 16);
    var red = (color >> 16) & 255;
    var green = (color >> 8) & 255;
    var blue = color & 255;
    var hex = _.map([red, green, blue], function(c, i) {
      return padDigits(((c >> 4) * 0x10).toString(16), 2);
    }).join('');

    hexes.push(hex);
  }

  return hexes;
}

function gen_tripcode(el) {
  // Now that we have our tripcodes, do other things...
  var colors = get_colors_for_hash($(el).attr("data-tripcode"));
  var div = $(el);
  _.each(colors, function(color) {
    var colorDiv = $("<div class='tripcolor' />").css({
      "background-color": "#" + color,
    });
    div.append(colorDiv);

    $(el).css({
      position: "relative"
    });
  });
}


module.exports = {
  gen_tripcode: gen_tripcode
};
