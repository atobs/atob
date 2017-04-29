"use strict";

var controller = require_core("server/controller");

// Helpers for serialized form elements
var value_of = controller.value_of;

var array_of = controller.array_of;


var config = require_core("server/config");
var chat = require_app("server/chat");
var posting = require_app("server/posting");
var render_posting = posting.render_posting;
var makeme_store = require_app("server/makeme_store");
var post_links = require_app("server/post_links");
var board_names = require_app("server/board_names");
var Post = require_app("models/post");
var ArchivedPost = require_app("models/archived_post");
var Board = require_app("models/board");
var worship_boards = require_app("server/worship_boards");

var client_api = require_app("server/client_api");
var sponsored_content = require_app("server/sponsored_content");

var crypto = require("crypto");
var gen_md5 = h => {
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

  get(ctx, api) {
    this.set_title("atob");
    api.template.add_stylesheet("post");
    $C("delete_post_modal", {}).marshall();

    api.bridge.call("app/client/sidebar", "add_sidebars");
    var render_sponsored_content = sponsored_content.render(api);
    var render_post = api.page.async(flush => {

      Post.find({
          where: { id: ctx.req.params.id},
          include: [
            {model: Post, as: "Children" },
          ]})
        .success(result => {
          if (!result) { 
            // Do a check to see if the post is archived...
            var app = require_core("server/main").app;
            ArchivedPost.find({
              where: { id: ctx.req.params.id},
            }).success(result => {
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

          if (post_data.board_id === board_names.CHAT) {
            api.bridge.controller("posts", "goto_chat");
            flush();
            return;
          }

          if (post_data.parent_id) {
            Post.find({
              where: { id: post_data.thread_id },
              include: [
                {model: Post, as: "Children" },
              ]
            }).success(parent => {
              if (!parent) {
                render_posting(api, flush, result);
              } else {
                api.bridge.controller("posts", "focus_post", post_data.id);
                render_posting(api, flush, parent, post_data.id);
              }
            });

          } else {
            if (ctx.req.query && ctx.req.query.e) {
              api.bridge.controller("posts", "focus_post", post_data.id);
            }
            render_posting(api, flush, result);
          }

        });

    });

    var render_sinners = api.page.async(flush => {
      Post.findAll({
        where: {
          board_id: worship_boards.boards,
        }
      }).success(results => {
        var sinners = _.map(results, r => r.dataValues);
        api.bridge.call("app/client/sinners", "punish", sinners);
        flush();
      });
    });
    render_sinners();

    api.bridge.controller("posts", "resaturate_tripbar");
    api.bridge.controller("posts", "set_api_key", config.imgur_key);
    var render_recent_chats = chat.render_recent(api);
    var template_str = api.template.render("controllers/posts/show.html.erb", 
      { 
        render_post, 
        render_recent_chats,
        tripcode: gen_md5(Math.random()),
        render_sponsored_content
      });
    api.page.render({ content: template_str, socket: true });
  },

  socket(s) {
    var _board;

    client_api.add_to_socket(s);
    makeme_store.subscribe_to_updates(s);

    s.on("join", board => {
      makeme_store.lurk(s, board);
      s.spark.join(board);
      s.board = board;
      _board = board;
      s.emit("joined", board);
    });

    posting.add_socket_subscriptions(s);

  }
};
