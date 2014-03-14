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
    "/:id" : "index",
  },

  index: function(ctx, api) {
    var board_id = ctx.req.params.id;
    var template_str = api.template.render("controllers/boards/boards.html.erb", { board: board_id});
    Post.findAll({ where: { board_id: board_id }}).success(function(results) {
      console.log("POSTS ARE", results); 
    });
    api.page.render({ content: template_str});
  },

  socket: function() {}
};
