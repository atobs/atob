"use strict";

var controller = require_core("server/controller");
// Helpers for serialized form elements
var value_of = controller.value_of,
    array_of = controller.array_of;

var Post = require_app("models/post");
var Board = require_app("models/board");
var $ = require("cheerio");

var crypto = require("crypto");
var gen_md5 = function(h) {
  var hash = crypto.Hash("md5");
  hash.update(h);
  return hash.digest("hex");
};

var REPLY_MAX = 200;
var POST_TIMEOUT = 20 * 1000;
var REPLY_TIMEOUT = 3 * 1000;

var GOING_ONS = {
  active: {},
  idle: {}
};

var DOWNCONS = [
  ":thumbs-down:",
  ":law:"
];

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
          order: "updated_at ASC",
          limit: 20,
          include: [
            {model: Post, as: "Children" },
            {model: Post, as: "Thread" }
          ]
      }).success(function(results) {
        if (!results || !results.length) {
          return flush();
        }

        var div = $("<div></div>");
        _.each(results, function(result) {
          var post_data = result.dataValues;
          post_data.post_id = post_data.id;
          delete post_data.id;
          post_data.replies = _.map(result.children, function(c) { return c.dataValues; } );
          post_data.replies = _.sortBy(post_data.replies, function(d) {
            return new Date(d.created_at);
          });

          post_data.client_options = _.clone(post_data);
          var postCmp = $C("post", post_data);
          div.prepend(postCmp.$el);
          postCmp.marshall();
        });
        flush(div);
      });
    });

    var template_str = api.template.render("controllers/boards/show.html.erb", {
      board: board_id,
      tripcode: gen_md5("" + Math.random()),
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
      s.spark.join(board);
      _board = board;
      s.emit("joined", board);
    });

    var last_post = 0;
    var last_reply = 0;

    s.on("new_post", function(post) {
      if (Date.now() - last_post < POST_TIMEOUT) {
        return;
      }

      last_post = Date.now();

      var title = post.title;
      var text = post.text;
      var tripcode = post.tripcode || "";
      var author = post.author || "anon";
      var data = {
        title: title,
        text: text,
        tripcode: gen_md5(author + ":" + tripcode),
        board_id: _board,
        author: author,
        replies: 0,
        downs: 0,
        ups: 0
      };

      Post.create(data)
        .success(function(p) {
          data.post_id = p.id;
          s.broadcast.to(_board).emit("new_post", data);
          s.emit("new_post", data);
        });
    });

    s.on("new_reply", function(post) {
      if (Date.now() - last_post < REPLY_TIMEOUT) {
        return;
      }

      last_reply  = Date.now();

      var author = post.author || "anon";
      var text = post.text.split("||");
      var title = "";
      if (text.length > 1) {
        title = text.shift();
        text = text.join("|");
      }

      // Do things to the parent, now...
      var down = false, up = false;
    
      _.each(DOWNCONS, function(downcon) {
        if (text.toString().match(downcon)) {
          down = true;
        }
      });

      Post.find({ where: { id: post.post_id }})
        .success(function(parent) {
          if (!down && parent.replies < REPLY_MAX) {
            parent.replies += 1;
            parent.save();
          }

          if (down) {
            parent.downs += 1;
            parent.save();
          }

          if (up) {
            parent.ups += 1;
            parent.save();
          }

        });

      Post.create({
          text: text,
          title: title,
          parent_id: post.post_id,
          thread_id: post.post_id,
          tripcode: gen_md5(author + ":" + post.tripcode),
          author: author
        }).success(function(p) {
          p.dataValues.post_id = p.dataValues.id;
          delete p.dataValues.id;
          s.broadcast.to(_board).emit("new_reply", p.dataValues);
          s.emit("new_reply", p.dataValues);
        });
    });

    var idleTimer;
    var sid = s.spark.headers.sid;
    function update_post_status(post_id) {
      var doings = {
        post_id: post_id,
        counts: _.map(GOING_ONS[post_id], function(v, k) { return v; })
      };
      s.broadcast.to(_board).emit("doings", doings);
      s.emit("doings", doings);
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
      }, 5000);

      update_post_status(doing.post_id);
    });
  }
};
