"use strict";

var Board = require_app("models/board");

module.exports = {
  routes: {
    "" : "index",
    "rules" : "rules",
    "faq" : "faq",
    "icons" : "icons"
  },

  index: function(ctx, api) {
    this.set_fullscreen(true);
    this.set_title("atob");
    var render_boards = api.page.async(function(flush) {
      Board.findAll({
          order: "name ASC"
        })
        .success(function(results) {
          var boards = _.map(results, function(r) { 
            return r.getDataValue('name'); 
          });

          var template_str = api.template.partial("home/board_links.html.erb", {
            boards: boards 
          });

          flush(template_str);

        });
    });

    var template_str = api.template.render("controllers/home.html.erb", {
      render_boards: render_boards,
    });

    api.page.render({ content: template_str});
  },
  rules: function(ctx, api) {
    var template_str = api.template.partial("home/rules.html.erb", {} );

    api.page.render({ content: template_str});

  },
  icons: function(ctx, api) {
    var template_str = api.template.partial("home/icons.html.erb", { });

    api.page.render({ content: template_str});

  },
  faq: function(ctx, api) {
    var template_str = api.template.partial("home/faq.html.erb", { });

    api.page.render({ content: template_str});

  },

  socket: function() {}
};
