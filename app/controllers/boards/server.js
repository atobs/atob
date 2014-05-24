"use strict";

var Post = require_app("models/post");
var Board = require_app("models/board");

var $ = require("cheerio");

var gen_md5 = require_app("server/md5");
var posting = require_app("server/posting");
var post_links = require_app("server/post_links");
var mod = require_app("server/mod");

var load_controller = require_core("server/controller").load;

var GOING_ONS = { 
  0: {}
};

var LAST_UPDATE = {};
var SCHEDULED = {};

function subscribe_to_updates(s) {
  var idleTimer;
  var sid = s.spark.headers.sid;
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
  s.on("isdoing", function(doing) {
    var olddoing = s.isdoing;

    function retimer() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function() {
        delete GOING_ONS[doing.post_id][sid];
        delete s.isdoing;

        update_post_status(doing.post_id);
      }, 30000);
    }

    // so complex. bad ideas.
    if (s.isdoing) {
      if (s.isdoing.post_id !== doing.post_id) {
        delete GOING_ONS[s.isdoing.post_id][sid];
      } else if (s.isdoing.what.match(":")) {
        if (doing.what.match(":")) {
          delete GOING_ONS[s.isdoing.post_id][sid];
        } else {
          retimer();
          return;
        }
      }
    }

    s.isdoing = doing;
    if (!GOING_ONS[doing.post_id]) {
      GOING_ONS[doing.post_id] = {};
    }

    GOING_ONS[doing.post_id][sid] = doing.what;

    retimer();
    update_post_status(doing.post_id);
    if (olddoing) {
      update_post_status(olddoing.post_id);
    }
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

    // Special case the links board
    if (board_id === "links") {
      ctx.res.redirect("/links");
      return;
    }

    // make sure it stays up to date
    $C("delete_post_modal", {}).marshall();

    api.template.add_stylesheet("board.css");

    var render_boards = api.page.async(function(flush) {
      Board.findAll({
          order: "name ASC"
        })
        .success(function(results) {
          var boards = _.map(results, function(r) {
            return r.getDataValue('name');
          });

          var template_str = api.template.partial("home/board_links.html.erb", {
            boards: boards
          });

          flush(template_str);

        });


    });
    var render_posts = api.page.async(function(flush) {
      Post.findAll({
          where: { board_id: board_id, thread_id: null },
          order: "bumped_at DESC",
          limit: 30
      }).success(function(results) {
        if (!results || !results.length) {
          return flush();
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

              post_data.client_options = _.clone(post_data);
              var postCmp = $C("post", post_data);
              flush_post(postCmp.toString());
            });
          });

          div.append(async_work());
        });

        flush(div);
      });
    });

    var template_str = api.template.render("controllers/boards/show.html.erb", {
      board: board_id,
      tripcode: gen_md5(Math.random()),
      render_posts: render_posts,
      render_boards: render_boards
    });

    api.bridge.controller("boards", "set_board", board_id);
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

    home_controller.get_socket().emit("doings", GOING_ONS);
  }, 2000),

  lurk: function(s) {
    var sid = s.spark.headers.sid;
    // pick a random lurk icon?
    var icons = [ ":coffee:", ":cup-coffeealt:", ":mug:", ":coffeecupalt:", ":tea:", ":teapot:" ];
    GOING_ONS[0][sid] = icons[_.random(icons.length-1)];
    clearTimeout(s.lurk_timer);
    s.lurk_timer = setTimeout(function() {
      delete GOING_ONS[0][sid];
    }, 60000);

    module.exports.update_doings();

  },

  socket: function(s) {
    var _board;
    s.on("join", function(board) {
      s.board = board;
      module.exports.lurk(s);
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
  GOING_ONS: GOING_ONS
};
