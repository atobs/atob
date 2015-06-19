"use strict";

var controller = require_core("server/controller");
// Helpers for serialized form elements
var value_of = controller.value_of,
    array_of = controller.array_of;

var Post = require_app("models/post");
var Action = require_app("models/action");
var board_utils = require_app("server/board_utils");

function make_trips(flush, icon) {
  return function (results) {
      var container = $("<div class='container'/>");
      if (results) {
        
        var tripcode_gen = require_app("server/tripcode");
        _.each(results, function(res) {
          var el = $("<div class='tripcode' />");
          el.attr("data-tripcode", res.object);
          el.css({
            width: "100px",
            display: "inline-block",
            height: "20px"
          });

          container.append(el);
          tripcode_gen.gen_tripcode(el);
          el.children().each(function() {
            var child = $(this);
            child.addClass(icon);
            var bgColor = child.css("background-color");

            child.css({
              "background-color": "inherit",
              color: bgColor
            });
          });


        });
      }

      flush(container.html());
  };
}


module.exports = {
  // If the controller has assets in its subdirs, set is_package to true
  is_package: false,
  routes: {
    "/:id" : "show",
  },

  show: function(ctx, api) {
    api.template.add_stylesheet("profile");

    api.bridge.call("app/client/sidebar", "add_sidebars");
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

          // Over here, we should find out who they have sunk...

          if (post_count + reply_count < 5) {
            api.bridge.controller("profiles", "is_noob");
          }
          flush(template_str);
        } else {
          flush("");
        }
      });
    
    });

    var render_ships = api.page.async(function(flush) {
      Action.findAll({where: {
        actor: tripcode,
        action: "burtled"
      }}).success(make_trips(flush, "icon-ghost"));
    });

    var render_burtles = api.page.async(function(flush) {
      Action.findAll({where: {
        actor: tripcode,
        action: "sunkship"
      }}).success(make_trips(flush, "icon-pacman"));

    });

    var template_str = api.template.render("controllers/profiles/profiles.html.erb", { 
      tripcode: tripcode,
      render_about: render_about,
      render_ships: render_ships,
      render_burtles: render_burtles
    });
    api.page.render({ content: template_str });
  },

  socket: function() {}
};
