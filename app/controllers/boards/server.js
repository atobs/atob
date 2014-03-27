"use strict";

var Post = require_app("models/post");
var Board = require_app("models/board");

var $ = require("cheerio");

var gen_md5 = require_app("server/md5");
var posting = require_app("server/posting");
var mod = require_app("server/mod");

var load_controller = require_core("server/controller").load;

var GOING_ONS = {
  active: {},
  idle: {}
};

function subscribe_to_updates(s) {
  var idleTimer;
  var sid = s.spark.headers.sid;
  function update_post_status(post_id) {
    var doings = {
      post_id: post_id,
      counts: _.map(GOING_ONS[post_id], function(v) { return v; })
    };

    var boards_controller = load_controller("boards");
    var board_socket = boards_controller.get_socket();
    board_socket.broadcast.to(s.board).emit("doings", doings);
    s.emit("doings", doings);

    var posts_controller = load_controller("posts");
    var post_socket = posts_controller.get_socket();
    post_socket.broadcast.to(s.board).emit("doings", doings);

  }

  // TODO: make a better schema for how this works
  s.on("isdoing", function(doing) {
    if (s.isdoing) {
      delete GOING_ONS[s.isdoing.post_id][sid];
      update_post_status(s.isdoing.post_id);
    }

    s.isdoing = doing;
    if (!GOING_ONS[doing.post_id]) {
      GOING_ONS[doing.post_id] = {};
    }

    GOING_ONS[doing.post_id][sid] = doing.what;

    clearTimeout(idleTimer);
    idleTimer = setTimeout(function() {
      delete GOING_ONS[doing.post_id][sid];
      update_post_status(doing.post_id);
    }, 30000);

    update_post_status(doing.post_id);
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
          limit: 10
      }).success(function(results) {
        if (!results || !results.length) {
          return flush();
        }

        var div = $("<div></div>");
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

    api.page.render({
      content: template_str,
      socket: true,
      component: true
    });

  },

  socket: function(s) {
    var _board;
    s.on("join", function(board) {
      s.board = board;
      s.spark.join(board);
      _board = board;
      s.emit("joined", board);
    });

    var last_post = 0;
    var last_reply = 0;

    s.on("delete_post", function(post) {
      var board = post.board || _board;
      // Special case mod postings
      posting.handle_delete_post(s, board, post);
    });

    s.on("new_post", function(post) {
      var board = post.board || _board;
      // Special case mod postings
      if (board === "mod") {
        mod.handle_new_post(s, post);  
      } else {
        last_post = posting.handle_new_post(s, board, post);
      }
    });

    s.on("new_reply", function(post) {
      last_reply = posting.handle_new_reply(s, _board, post);
    });


    subscribe_to_updates(s);

  },

  handle_new_reply: posting.handle_new_reply,
  handle_new_post: posting.handle_new_post,
  subscribe_to_updates: subscribe_to_updates
};
