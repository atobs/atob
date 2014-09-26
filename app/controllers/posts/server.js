"use strict";

var controller = require_core("server/controller");
// Helpers for serialized form elements
var value_of = controller.value_of,
    array_of = controller.array_of;
    

var posting = require_app("server/posting");
var post_links = require_app("server/post_links");
var Post = require_app("models/post");
var ArchivedPost = require_app("models/archived_post");
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
    $C("delete_post_modal", {}).marshall();

    var board_utils = require_app("server/board_utils");
    var render_boards = board_utils.render_boards();
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
        posting.trim_post(post_data.client_options);
        post_links.freshen_client(post_data.post_id, result.children, function() {
          var postCmp = $C("post", post_data);
          var text_formatter = require_root("app/client/text");
          var tripcode_gen = require_app("server/tripcode");
          postCmp.add_markdown(text_formatter);
          postCmp.gen_tripcodes(tripcode_gen.gen_tripcode);
          api.bridge.controller("posts", "set_board", post_data.board_id);
          flush(postCmp.toString());
        });
      }

      Post.find({
          where: { id: ctx.req.params.id},
          include: [
            {model: Post, as: "Children" },
          ]})
        .success(function(result) {
          if (!result) { 
            // Do a check to see if the post is archived...
            var app = require_core("server/main").app;
            ArchivedPost.find({
              where: { id: ctx.req.params.id},
            }).success(function(result) {
              if (result) {

                var url = app.router.build("archives.get", {
                  id: ctx.req.params.id
                });

                api.bridge.controller("posts", "goto", url);

                return flush("");
              } else {
                var upeye = $C("upeye", { title: "something's not right here..."});
                api.bridge.controller("posts", "hide_loading");
                return flush(upeye.toString());

              }
            });

            return;
          }

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
    var template_str = api.template.render("controllers/posts/show.html.erb", 
      { render_post: render_post, render_boards: render_boards, tripcode: gen_md5(Math.random()) });
    api.page.render({ content: template_str, socket: true });
  },

  socket: function(s) {
    var _board;

    var load_controller = require_core("server/controller").load;
    var boards_controller = load_controller("boards");
    boards_controller.subscribe_to_updates(s);

    s.on("join", function(board) {
      boards_controller.lurk(s);
      s.spark.join(board);
      s.board = board;
      _board = board;
      s.emit("joined", board);
    });

    s.on("new_reply", function(post, cb) {
      posting.handle_new_reply(s, _board, post, cb);
    });

    s.on("new_post", function(post, cb) {
      posting.handle_new_post(s, _board, post, cb);
    });

    s.on("delete_post", function(post) {
      posting.handle_delete_post(s, _board, post);
    });

    s.on("update_post", function(post, cb) {
      posting.handle_update_post(s, _board, post, cb);
    });

    s.on("upboat", function(link, cb) {
      post_links.upvote_link(link, cb);
    });


  }
};
