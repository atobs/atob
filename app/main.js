"use strict";

var sequelize = require_app("models/model");
var fakedata = require_app("fakedata");
var Board = require_app("models/board");
var config = require_core("server/config");
var zlib = require("zlib");


var DEFAULT_BOARDS = [
  {
    code: "a"
  },
  {
    code: "b"
  }
];
module.exports = {
  setup_app: function(app) {
    var force_reset = process.env.RESET;
    sequelize.instance.sync({ force: force_reset }).success(function() {
      console.log("Synced SQL DB to models");

      if (process.env.FAKEDATA) {
        fakedata.generate();
      } else {
        _.each(config.boards || DEFAULT_BOARDS, function(board) {
          Board.findOrCreate({
            name: board.code,
            title: board.title
          });
        });
      }
    });

  },
  setup_request: function(req, res) {
    if (req.path.indexOf("/pkg") !== 0) {
      console.log("Handling request", req.path, req.query, req.params);
    }
    res.charset = "utf-8";
  },
  setup_plugins: function(app) {
    app.add_plugin_dir("app/plugins/slog");
    app.add_plugin_dir("app/plugins/tester");
  },
  after_cache: function(app) {
    // Setup our 404 handler
    var router = require_core('server/router');
    var context = require_core("server/context");
    app.use(function(req, res) {
      var api = router.API;
      var stream = zlib.createGzip();
      stream._flush = zlib.Z_SYNC_FLUSH;
      stream.pipe(res);

      res.set("Transfer-Encoding", "chunked");
      res.set("Content-Encoding", "gzip");
      res.set("Content-Type", "text/html");
      context.create({
        req: req,
        res: res,
        controller: "home",
        stream: stream

      }, function(ctx) {
        var upeye = $C("upeye", { title: "" });
        var template_str = api.template.partial("home/404.html.erb", {
          render_upeye: upeye.toString
        });


        api.page.render({ content: template_str });
        ctx.exit();
      });

    });
  },
  setup_template_context: function(ret) {
    ret.$ = require("cheerio");
  }
};
