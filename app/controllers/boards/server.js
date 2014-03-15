"use strict";

var controller = require_core("server/controller");
// Helpers for serialized form elements
var value_of = controller.value_of,
    array_of = controller.array_of;

var Post = require_app("models/post");
var $ = require("cheerio");

var crypto = require("crypto");
var gen_md5 = function(h) {
  var hash = crypto.Hash("md5");
  hash.update(h);
  return hash.digest("hex");
};

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

    var render_posts = api.page.async(function(flush) {
      Post.findAll({ 
          where: { board_id: board_id, thread_id: null }, 
          order: "created_at ASC",
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
      render_posts: render_posts
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

    s.on("new_post", function(post) {
      var title = post.title;
      var text = post.text;
      var tripcode = post.tripcode || "";
      var author = post.author || "anon";
      var data = {
        title: title,
        text: text,
        tripcode: gen_md5(author + ":" + tripcode),
        board_id: _board,
        author: author
      };

      Post.create(data)
        .success(function(p) {
          data.post_id = p.id;
          s.broadcast.to(_board).emit("new_post", data);
          s.emit("new_post", data);
        });
    });

    s.on("new_reply", function(post) {
      var author = post.author || "anon";
      var text = post.text.split("|");
      var title = "";
      if (text.length > 1) {
        title = text.shift();
        text = text.join("|");
      }

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
  }
};
