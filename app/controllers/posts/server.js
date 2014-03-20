"use strict";

var controller = require_core("server/controller");
// Helpers for serialized form elements
var value_of = controller.value_of,
    array_of = controller.array_of;
    

var Post = require_app("models/post");
module.exports = {
  // If the controller has assets in its subdirs, set is_package to true
  is_package: false,
  routes: {
    "/:id" : "get",
  },

  get: function(ctx, api) {

    var render_post = api.page.async(function(flush) {
      Post.find({
          where: { id: ctx.req.params.id},
          include: [
            {model: Post, as: "Children" },
            {model: Post, as: "Thread" }
          ]})
        .success(function(result) {
          var post_data = result.dataValues;
          post_data.post_id = post_data.id;
          delete post_data.id;
          post_data.replies = _.map(result.children, function(c) { return c.dataValues; } );
          post_data.replies = _.sortBy(post_data.replies, function(d) {
            return new Date(d.created_at);
          });

          post_data.client_options = _.clone(post_data);
          var postCmp = $C("post", post_data);
          api.bridge.controller("posts", "set_board", post_data.board_id);
          flush(postCmp.toString());
        });

    });

    var template_str = api.template.render("controllers/posts/show.html.erb", { render_post: render_post });
    api.page.render({ content: template_str, socket: true });
  },

  socket: function(s) {
    var _board;
    s.on("join", function(board) {
      s.spark.join(board);
      _board = board;
      s.emit("joined", board);
    });

  }
};
