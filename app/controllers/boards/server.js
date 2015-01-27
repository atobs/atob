"use strict";

var Post = require_app("models/post");
var Board = require_app("models/board");
var Link = require_app("models/link");

var $ = require("cheerio");

var gen_md5 = require_app("server/md5");
var posting = require_app("server/posting");
var post_links = require_app("server/post_links");
var mod = require_app("server/mod");
var config = require_core("server/config");

var load_controller = require_core("server/controller").load;

var GOING_ONS = { 
  0: {}
};
var LAST_SEEN = {

};

var DOINGS = {};

var LAST_UPDATE = {};
var SCHEDULED = {};

var BOARD_SLOGANS = {
  "a" : "is for anon",
  "b" : "is for banal",
  "to" : "random anon is random",
  "gifs" : "and other pics"
};

var board_utils = require_app("server/board_utils");

var sockets = {};

function subscribe_to_updates(s) {

  var idleTimer;
  var sid = s.spark.headers.sid;
  sockets[sid] = sockets[sid] || [];
  sockets[sid].push(s);
  function update_post_status(post_id) {
    var doings = {
      post_id: post_id,
      counts: _.map(GOING_ONS[post_id], function(v) { return v; })
    };
    var last_update = LAST_UPDATE[post_id];
    if (last_update && Date.now() - last_update < 1000) {
      // need to make sure this does happen eventually...
      clearTimeout(SCHEDULED[post_id]);
      SCHEDULED[post_id] = setTimeout(function() {
        delete SCHEDULED[post_id];
        update_post_status(post_id); 
      }, 500);
      return;
    }

    LAST_UPDATE[post_id] = Date.now();

    var boards_controller = load_controller("boards");
    var board_socket = boards_controller.get_socket();
    board_socket.broadcast.to(s.board).emit("doings", doings);
    s.emit("doings", doings);

    var posts_controller = load_controller("posts");
    var post_socket = posts_controller.get_socket();
    post_socket.broadcast.to(s.board).emit("doings", doings);

    module.exports.update_doings();
  }

  // TODO: make a better schema for how this works
  s.on("isdoing", function(doing, cb) {
    var olddoing = s.isdoing || DOINGS[sid];


    if (doing.what === "stalking") {
      if (doing.anon === sid) {
        s.emit("bestalked");
        return;
      }

      var stalked_socket = sockets[doing.anon];
      if (stalked_socket) {
        _.each(stalked_socket, function(s) {
          s.emit("bestalked", { by: sid, sid: doing.anon });

        });
      } else {
        s.emit("bestalked");
      }
    }

    LAST_SEEN[sid] = Date.now();


    function retimer(interval) {
      interval = interval || 30000;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function() {
        delete GOING_ONS[doing.post_id][sid];
        delete s.isdoing;
        delete DOINGS[sid];
        module.exports.lurk(s);

        update_post_status(doing.post_id);
      }, interval);
    }

    // so complex. bad ideas.
    if (olddoing) {
      if (olddoing.post_id !== doing.post_id) {
        delete GOING_ONS[olddoing.post_id][sid];
      } else if (olddoing.what.match(":")) {
        if (doing.what.match(":")) {
          delete GOING_ONS[olddoing.post_id][sid];
        } else {
          retimer(30 * 60 * 1000);
          if (cb) { cb(); }
          return;
        }
      } else {
        // check if we are stalking...
        // if so, we dont let the icon change for a little while
        if (olddoing.what === "stalking") {
          update_post_status(doing.post_id);

          if (cb) { cb(); }
          return;
        }

      }

    }

    DOINGS[sid] = s.isdoing = doing;
    if (!GOING_ONS[doing.post_id]) {
      GOING_ONS[doing.post_id] = {};
    }

    GOING_ONS[doing.post_id][sid] = doing.what;

    retimer();
    update_post_status(doing.post_id);
    if (olddoing) {
      update_post_status(olddoing.post_id);
    }

    if (cb) { cb(); }
  });

}
module.exports = {
  // If the controller has assets in its subdirs, set is_package to true
  is_package: false,
  routes: {
    "/:id" : "show",
  },

  index: function(ctx, api) {
    api.page.render({
      content: "Nothing to see here"
    });
  },
  show: function(ctx, api) {
    var board_id = ctx.req.params.id;
    this.set_title("atob/" + board_id);
    this.set_fullscreen(true);

    var specials = [ "links", "archives", "gifs", "chat" ];
    var redir;
    _.each(specials, function(board) {
      if (board_id === board) {
        ctx.res.redirect("/" + board);
        redir = true;
      }
    });

    if (redir) {
      return;
    }

    // make sure it stays up to date
    $C("delete_post_modal", {}).marshall();

    api.template.add_stylesheet("board.css");
    var render_boards = board_utils.render_boards();

    var board_id_clause = board_id;
    var board_slogan = BOARD_SLOGANS[board_id] || "";
    var limit = 30;
    var order_clause = "bumped_at DESC";
    if (board_id === "to") {
      board_id_clause = null;
      order_clause = "created_at DESC";
      limit = 300;
    }

    var where = {};
    if (board_id_clause) {
      where.board_id = board_id_clause;
    }
    where.thread_id = null;

    var render_posts = api.page.async(function(flush) {
      Post.findAll({
          where: where,
          order: order_clause,
          limit: limit
      }).success(function(results) {
        if (!results || !results.length) {
          api.bridge.controller("boards", "no_posts");
          return flush();
        }

        if (board_id === "to") {
          
          results = _.filter(results, function(r) { 
            var is_hidden = false;
            _.each([ "heretics", "faq", "bugs", "log", "mod", "cop", "ban", "test"], function(board) {
              is_hidden = is_hidden || board === r.board_id;
            });

            return !is_hidden;
          });

          results = _.shuffle(results);
        }

        var div = $("<div></div>");

        // add an old post, for fun
        var grabbag = results[_.random(10, results.length-1)];
        results = results.slice(0, 10);
        if (grabbag) {
          results.push(grabbag);
        }

        _.each(results, function(result) {
          var async_work = api.page.async(function(flush_post) {
            result.getChildren().success(function(children) {
              var post_data = result.dataValues;
              post_data.post_id = post_data.id;
              delete post_data.id;
              post_data.replies = _.map(children, function(c) { return c.dataValues; } );
              post_data.replies = _.sortBy(post_data.replies, function(d) {
                return d.id;
              });

              var client_options = _.clone(post_data);
              post_data.client_options = client_options;
              posting.trim_post(client_options);

              post_links.freshen_client(post_data.post_id, children, function() {
                var postCmp = $C("post", post_data);
                var text_formatter = require_root("app/client/text");
                postCmp.add_markdown(text_formatter);
                var tripcode_gen = require_app("server/tripcode");
                postCmp.gen_tripcodes(tripcode_gen.gen_tripcode);

                flush_post(postCmp.toString());
              });

            });
          });

          div.append(async_work());
        });

        flush(div);
      });
    });

    var render_sinners = api.page.async(function(flush) {
      Post.findAll({
        where: {
          board_id: "heretics"
        }
      }).success(function(results) {
        var sinners = _.map(results, function(r) { return r.dataValues; });
        api.bridge.call("app/client/sinners", "punish", sinners);
        flush();
      });
    });
    render_sinners();

    var template_str = api.template.render("controllers/boards/show.html.erb", {
      board: board_id,
      tripcode: gen_md5(Math.random()),
      render_posts: render_posts,
      render_boards: render_boards,
      board_slogan: board_slogan,
      new_thread: board_id !== "to"
    });

    api.bridge.controller("boards", "set_board", board_id);
    api.bridge.controller("boards", "set_api_key", config.imgur_key);
    var rss_str = api.template.partial("rss.html.erb", { board: board_id });
    this.add_to_head(rss_str);

    api.page.render({
      content: template_str,
      socket: true,
      component: true
    });

  },

  update_doings: _.throttle(function() {
    var load_controller = require_core("server/controller").load;
    var home_controller = load_controller("home");
    var boards_controller = load_controller("boards");
    var posts_controller = load_controller("posts");

    var now = Date.now();
    var last_seen = {};
    _.each(LAST_SEEN, function(then, sid) {
      var duration = now - then; 
      if (duration > 60 * 60 * 3600) {
        delete LAST_SEEN[sid];
      } else {
        last_seen[sid] = duration;
      }
    });

    home_controller.get_socket().emit("anons", GOING_ONS, last_seen);
    boards_controller.get_socket().emit("anons", GOING_ONS, last_seen);
    posts_controller.get_socket().emit("anons", GOING_ONS, last_seen);
  }, 2000),

  lurk: function(s, board_id) {
    var sid = s.spark.headers.sid;

    LAST_SEEN[sid] = Date.now();
    if (board_id && board_id.length === 1) {
      if (Math.random() < 0.50) {
        GOING_ONS[0][sid] = ":circle" + board_id + ":"; 
      } else {
        GOING_ONS[0][sid] = ":square" + board_id + ":"; 
      }
    } else {
      // pick a random lurk icon?
      var icons = [ ":coffee:", ":cup-coffeealt:", ":mug:", ":coffeecupalt:", ":tea:", ":teapot:" ];
      GOING_ONS[0][sid] = icons[_.random(icons.length-1)];
    }
    clearTimeout(s.lurk_timer);
    s.lurk_timer = setTimeout(function() {
      delete GOING_ONS[0][sid];
    }, 60 * 60 * 1000);

    module.exports.update_doings();

  },

  socket: function(s) {
    var _board;

    var joined = {};
    s.on("join", function(board) {
      s.board = board;
      if (joined[board]) {
        return;
      }

      joined[board] = true;
      module.exports.lurk(s, board);
      s.spark.join(board);
      _board = board;
      s.emit("joined", board);
    });

    s.on("update_post", function(post, cb) {
      var board = post.board || _board;
      posting.handle_update_post(s, board, post, cb);
    });

    s.on("delete_post", function(post) {
      var board = post.board || _board;
      // Special case mod postings
      posting.handle_delete_post(s, board, post);
    });

    s.on("new_post", function(post, cb) {
      var board = post.board || _board;
      // Special case mod postings
      if (board === "mod") {
        mod.handle_new_post(s, post);  
      } else {
        posting.handle_new_post(s, board, post, cb);
      }
    });

    s.on("new_reply", function(post, cb) {
      posting.handle_new_reply(s, _board, post, cb);
    });

    s.on("upboat", function(link, cb) {
      post_links.upvote_link(link, cb);
    });



    subscribe_to_updates(s);

  },

  handle_new_reply: posting.handle_new_reply,
  handle_new_post: posting.handle_new_post,
  subscribe_to_updates: subscribe_to_updates,
  GOING_ONS: GOING_ONS,
  LAST_SEEN: LAST_SEEN,
  BOARD_SLOGANS: BOARD_SLOGANS
};
