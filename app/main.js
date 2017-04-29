"use strict";

var sequelize = require_app("models/model");
var fakedata = require_app("fakedata");
var Board = require_app("models/board");
var config = require_core("server/config");
var zlib = require("zlib");
var board_names = require_app("server/board_names");
var body_parser = require("body-parser");
var snorkel_api = require_app("server/snorkel_api");


if (process.env.DEBUG) {
  var heapdump = require("heapdump");
}


var DEFAULT_BOARDS = [
  {
    code: "a"
  },
  {
    code: "b"
  }
];
var EventEmitter = require("events").EventEmitter;
var db_emitter = new EventEmitter();

module.exports = {
  setup_app(app) {
    var force_reset = process.env.RESET;

    // add in marked and cheerio to our globals
    global.marked = require_root("app/static/vendor/marked");
    global.$ = require("cheerio");
    global.md5 = require_app("server/md5");

    sequelize.archive.sync({ force: force_reset });
    sequelize.instance.sync({ force: force_reset }).success(() => {
      console.log("Synced SQL DB to models");

      if (force_reset) {
        var Post = require_app("models/post");
        Post.create({ board_id: board_names.CHAT, title: "welcome to atob",  }).success(() => { });
      }

      if (process.env.FAKEDATA) {
        fakedata.generate();
      } else {
        _.each(config.boards || DEFAULT_BOARDS, board => {
          Board.findOrCreate({
            name: board.code,
            title: board.title
          });
        });

      }

      db_emitter.emit("synced");


      var board_migrations = require_app("server/board_migrations");
      board_migrations.run();


    });

    app.use(body_parser.urlencoded({ extended: true }));
    app.use(body_parser.json());
  },
  setup_request(req, res) {
    if (req.path.indexOf("/pkg") !== 0) {
      console.log("Handling request", req.path, req.query, req.params);
    }
    res.charset = "utf-8";

    var ua = req.headers['user-agent'];
    if (/mobile/i.test(ua)) {
      req.is_mobile = true;
    }

    req.start = Date.now();

    if (req.headers.referer && req.sessionID) { 
      // TODO: add more, for 4ch, euphoria, etc
      var makeme_store = require_app("server/makeme_store");
      if (req.headers.referer.match('reddit')) {

        makeme_store.add_doing(req.sessionID, {
          what: "reddit",
          ttl: 30,
          pri: 30
        });
      } 
      if (req.headers.referer.match('google')) {

        makeme_store.add_doing(req.sessionID, {
          what: "google",
          ttl: 5,
          pri: 30
        });
      } 


    }

  },
  end_request(req) {
    var end = Date.now();
    var diff = end - req.start;
    console.log("Finished request", req.path, "(" +  diff +  "ms)");

    if (_.isNumber(diff) && !_.isNaN(diff)) {
      var s = new snorkel_api.Sample("pagestats");
      s.string("page", req.path);
      s.integer("gen", diff);
      s.integer("time", parseInt(Date.now() / 1000, 10));
      snorkel_api.decorate_sample(s, snorkel_api.DECO.browser_info, req);
      s.send();

    }

  },
  setup_context(ctx) {
    ctx.use_fullscreen = true;
  },
  setup_plugins(app) {
    app.add_plugin_dir("app/plugins/slog");
    app.add_plugin_dir("app/plugins/tester");
  },
  after_cache(app) {
    // Setup our 404 handler
    var router = require_core('server/router');
    var context = require_core("server/context");
    app.use((req, res) => {
      var api = router.API;
      var stream = zlib.createGzip();
      stream._flush = zlib.Z_SYNC_FLUSH;
      stream.pipe(res);

      res.set("Transfer-Encoding", "chunked");
      res.set("Content-Encoding", "gzip");
      res.set("Content-Type", "text/html");
      context.create({
        req,
        res,
        controller: "home",
        stream

      }, ctx => {
        var upeye = $C("upeye", { title: "" });
        var template_str = api.template.partial("home/404.html.erb", {
          render_upeye: upeye.toString
        });


        api.page.render({ content: template_str });
        ctx.exit();
      });

    });
  },
  setup_template_context(ret) {
    ret.$ = require("cheerio");
  },
  db_emitter
};
