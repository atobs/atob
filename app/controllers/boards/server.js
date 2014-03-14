"use strict";

var controller = require_core("server/controller");
// Helpers for serialized form elements
var value_of = controller.value_of,
    array_of = controller.array_of;

var Post = require_app("models/post");
var $ = require("cheerio");

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
      Post.findAll({ where: { board_id: board_id }})
        .success(function(results) {
          if (!results || !results.length) {
            return flush();
          }

          var div = $("<div></div>");
          _.each(results, function(result) {
            delete result.dataValues.id;
            var postCmp = $C("post", result.dataValues );
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
      var title = value_of(post, "title");
      var text = value_of(post, "text");
      var tripcode = value_of(post, "tripcode", "");
      var data = {
        title: title,
        text: text,
        tripcode: tripcode,
        board_id: _board,
      };

      Post.create(data)
        .success(function() {
          s.broadcast.to(_board).emit("new_post", data);
          s.emit("new_post", data);
        });
    });
  }
};
