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
    "/:id" : "index",
  },

  index: function(ctx, api) {
    var board_id = ctx.req.params.id;

    var render_posts = api.page.async(function(flush) {
      Post.findAll({ where: { board_id: board_id }})
        .success(function(results) {
          var div = $("<div />");
          _.each(results, function(result) {
            delete result.dataValues.id;
            var postCmp = $C("post", result.dataValues );
            div.append(postCmp.$el);
            postCmp.marshall();
          });
          flush(div);
        });
    });

    var template_str = api.template.render("controllers/boards/boards.html.erb", {
      board: board_id,
      render_posts: render_posts
    });

    api.page.render({ 
      content: template_str
    });

  },

  socket: function() {}
};
