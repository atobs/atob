"use strict";

var controller = require_core("server/controller");
// Helpers for serialized form elements
var value_of = controller.value_of,
    array_of = controller.array_of;
    

var Post = require_app("models/post");
var Board = require_app("models/board");

var crypto = require("crypto");
var gen_md5 = function(h) {
  var hash = crypto.Hash("md5");
  hash.update(h + "");
  return hash.digest("hex");
};


module.exports = {
  // If the controller has assets in its subdirs, set is_package to true
  is_package: false,
  routes: {
    "/:id" : "get",
  },

  get: function(ctx, api) {
    this.set_fullscreen(true);
    this.set_title("atob");
    api.template.add_stylesheet("post");

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
    var render_post = api.page.async(function(flush) {
      function render_posting(result, highlight_id) {
        var post_data = result.dataValues;
        post_data = result.dataValues;
        post_data.post_id = post_data.id;
        post_data.highlight_id = highlight_id;
        post_data.maximized = true;
        post_data.collapsed = false;
        delete post_data.id;

        post_data.replies = _.map(result.children, function(c) { return c.dataValues; } );
        post_data.replies = _.sortBy(post_data.replies, function(d) {
          return new Date(d.created_at);
        });

        post_data.client_options = _.clone(post_data);
        var postCmp = $C("post", post_data);
        api.bridge.controller("posts", "set_board", post_data.board_id);
        flush(postCmp.toString());
      }

      Post.find({
          where: { id: ctx.req.params.id},
          include: [
            {model: Post, as: "Children" },
          ]})
        .success(function(result) {
          if (!result) { return flush("Couldn't find post. "); }

          var post_data = result.dataValues;

          // If it's a child post, get its thread
          if (post_data.parent_id) {
            Post.find({
              where: { id: post_data.thread_id },
              include: [
                {model: Post, as: "Children" },
              ]
            }).success(function(parent) {
              if (!parent) {
                render_posting(result);
              } else {
                api.bridge.controller("posts", "focus_post", post_data.id);
                render_posting(parent, post_data.id);
              }
            });

          } else {
            render_posting(result);
          }
        });

    });

    var template_str = api.template.render("controllers/posts/show.html.erb", 
      { render_post: render_post, render_boards: render_boards, tripcode: gen_md5(Math.random()) });
    api.page.render({ content: template_str, socket: true });
  },

  socket: function(s) {
    var _board;
    s.on("join", function(board) {
      s.spark.join(board);
      _board = board;
      s.emit("joined", board);
    });

    s.on("new_reply", function(post) {
      var boards_controller = require_app("controllers/boards/server");
      boards_controller.handle_new_reply(s, _board, post);
    });

    s.on("new_post", function(post) {
      var boards_controller = require_app("controllers/boards/server");
      boards_controller.handle_new_post(s, _board, post);
    });

    s.on("delete_post", function(post) {
      var boards_controller = require_app("controllers/boards/server");
      boards_controller.handle_delete_post(s, _board, post);
    });


  }
};
