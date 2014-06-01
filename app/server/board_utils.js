
var page = require_core("server/page");
var template = require_core("server/template");
var Board = require_app("models/board");
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
