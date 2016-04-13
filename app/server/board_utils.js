
var bridge = require_core("server/bridge");

var page = require_core("server/page");
var template = require_core("server/template");

module.exports = {
  render_boards: function() {
    var render_boards = page.async(function(flush) {
      var boards = [ "a", "to", "b", "links", "gifs" ];

      var template_str = template.partial("home/board_links.html.erb", {
        boards: boards
      });

      flush(template_str);

    });

    return render_boards;
  }
};
