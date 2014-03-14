"use strict";

var controller = require_core("server/controller");
// Helpers for serialized form elements
var value_of = controller.value_of,
    array_of = controller.array_of;
    

module.exports = {
  // If the controller has assets in its subdirs, set is_package to true
  is_package: false,
  routes: {
    "/:id" : "index",
  },

  index: function(ctx, api) {
    var template_str = api.template.render("controllers/boards/boards.html.erb", { board: ctx.req.params.id});
    api.page.render({ content: template_str});
  },

  socket: function() {}
};
