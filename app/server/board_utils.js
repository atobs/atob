
var bridge = require_core("server/bridge");

var page = require_core("server/page");
var template = require_core("server/template");

module.exports = {
  render_boards() {
    var render_boards = page.async(flush => {
      var boards = [ "a", "to", "b", "links", "gifs" ];

      var template_str = template.partial("home/board_links.html.erb", {
        boards
      });

      flush(template_str);

    });

    return render_boards;
  }
};
