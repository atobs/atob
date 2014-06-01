"use strict";

var controller = require_core("server/controller");
var gen_md5 = require_app("server/md5");
var Board = require_app("models/board");
var ArchivedPost = require_app("models/archived_post");
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
    api.template.add_stylesheet("archive");

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
        post_data.archived = true;

        var postCmp = $C("post", post_data);
        var text_formatter = require_root("app/client/text");
        postCmp.add_markdown(text_formatter);
        var tripcode_gen = require_app("server/tripcode");
        postCmp.gen_tripcodes(tripcode_gen.gen_tripcode);

        flush(postCmp.toString());
      }

      ArchivedPost.find({
          where: { id: ctx.req.params.id},
          include: [
            {model: ArchivedPost, as: "Children" },
          ]})
        .success(function(result) {
          if (!result) { 
            var upeye = $C("upeye", { title: "something's not right here..."});
            return flush(upeye.toString());
          }

          var post_data = result.dataValues;

          // If it's a child post, get its thread
          if (post_data.parent_id) {
            ArchivedPost.find({
              where: { id: post_data.thread_id },
              include: [
                {model: ArchivedPost, as: "Children" },
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

  socket: function() {}
};
