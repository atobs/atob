"use strict";

var controller = require_core("server/controller");
// Helpers for serialized form elements
var value_of = controller.value_of,
    array_of = controller.array_of;

var Post = require_app("models/post");
var board_utils = require_app("server/board_utils");
module.exports = {
  // If the controller has assets in its subdirs, set is_package to true
  is_package: false,
  routes: {
    "/:id" : "show",
  },

  show: function(ctx, api) {
    api.template.add_stylesheet("profile");
    this.set_fullscreen(true);

    var render_boards = board_utils.render_boards();
    var tripcode = ctx.req.params.id;

    var render_about = api.page.async(function(flush) {
      Post.findAll({
        where: {
          tripcode: tripcode

        }
        
      }).success(function(results) {

        if (results && results.length) {
          var post_count = _.filter(results, function(r) { return !r.selectedValues.parent_id; }).length;
          var reply_count = _.filter(results, function(r) { return r.selectedValues.parent_id; }).length;
          var first_seen = _.min(results, function(r) { return r.selectedValues.created_at; });
          var template_str = api.template.partial("profiles/stats.html.erb", {
            post_count: post_count,
            reply_count: reply_count,
            age: new Date(first_seen.created_at).toISOString()
          });
          api.bridge.controller("profiles", "timeago");
          flush(template_str);
        } else {
          flush("");
        }
      });
    
    });

    var template_str = api.template.render("controllers/profiles/profiles.html.erb", { 
      tripcode: tripcode,
      render_boards: render_boards,
      render_about: render_about
    });
    api.page.render({ content: template_str });
  },

  socket: function() {}
};
