"use strict";

var controller = require_core("server/controller");

// Helpers for serialized form elements
var value_of = controller.value_of;

var array_of = controller.array_of;

var Post = require_app("models/post");
var Action = require_app("models/action");
var Trophy = require_app("models/trophy");
var board_utils = require_app("server/board_utils");
var client_api = require_app("server/client_api");

function make_trips(flush, icon) {
  return results => {
      var container = $("<div class='container'/>");
      if (results) {
        
        var tripcode_gen = require_app("server/tripcode");
        _.each(results, res => {
          var el = $("<div class='tripcode' />");
          el.attr("data-tripcode", res.forcetrip || res.object);
          el.css({
            width: "100px",
            display: "inline-block",
            height: "20px"
          });

          container.append(el);
          tripcode_gen.gen_tripcode(el);
          el.children().each(function() {
            var child = $(this);
            child.addClass(icon || "icon-" + res.action.replace(/:/g, ""));
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

  show(ctx, api) {
    api.template.add_stylesheet("profile");

    api.bridge.call("app/client/sidebar", "add_sidebars");
    var tripcode = ctx.req.params.id;

    var render_about = api.page.async(flush => {
      Post.findAll({
        where: {
          tripcode

        }
        
      }).success(results => {

        if (results && results.length) {
          var post_count = _.filter(results, r => !r.selectedValues.parent_id).length;
          var reply_count = _.filter(results, r => r.selectedValues.parent_id).length;
          var first_seen = _.min(results, r => r.selectedValues.created_at);
          var template_str = api.template.partial("profiles/stats.html.erb", {
            post_count,
            reply_count,
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

    var render_ships = api.page.async(flush => {
      Action.findAll({where: {
        actor: tripcode,
        action: "burtled"
      }}).success(make_trips(flush, "icon-ghost"));
    });

    var render_burtles = api.page.async(flush => {
      Action.findAll({where: {
        actor: tripcode,
        action: "sunkship"
      }}).success(make_trips(flush, "icon-pacman"));

    });

    var render_trophies = api.page.async(flush => {
      Trophy.findAll({where: {
        anon: tripcode
      }}).success(results => {
        // Massage into form for the make_trips function
        _.each(results, r => {
          r.object = r.actor;
          r.actor = r.anon;
          r.action = r.trophy;
        });
        make_trips(flush)(results);
      });
    });

    api.bridge.controller("profiles", "set_code", tripcode);

    var template_str = api.template.render("controllers/profiles/profiles.html.erb", { 
      tripcode,
      render_about,
      render_ships,
      render_burtles,
      render_trophies
    });
    api.page.render({ content: template_str, socket: true });
  },

  socket(s) {
    client_api.add_to_socket(s); 
  }
};
