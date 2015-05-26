"use strict";

var controller = require_core("server/controller");
// Helpers for serialized form elements
var value_of = controller.value_of,
    array_of = controller.array_of;

var escape_html = require("escape-html");
var Post = require_app("models/post");
var HIDDEN_BOARDS = require_app("server/hidden_boards");

function find_posts(q, cb) {
  // turn query into escaped query...
  q = q.replace(/ /g, "%").replace("+", " ");
  var likeq = "%" + escape_html(q) + "%";

  Post.findAll({where: [ "(title like ? or text like ?)", likeq, likeq ], limit: 100, order: "ID DESC"})
    .success(function(results) {
      results = _.filter(results, function(r) {
        var is_hidden = false;
        _.each(HIDDEN_BOARDS, function(board) {
          is_hidden = is_hidden || board === r.board_id;
        });
        return !is_hidden;
      });

      if (results) {
        cb(_.last(results, 30));
      }
  });


}

module.exports = {
  // If the controller has assets in its subdirs, set is_package to true
  is_package: false,
  routes: {
    "" : "index",
  },

  index: function(ctx, api) {
    var query = ctx.req.query.q;
    var render_search_results = api.page.async(function(flush) {
      if (query) {
        find_posts(query, function(posts) {
          var div = $("<div />");
          var summarize = require_app("client/summarize");
          _.each(posts, function(p) {
            div.append(summarize(p));
          });

          flush(div.html());
        });
      } else {
        flush("");
      }

    });

    var template_str = api.template.render("controllers/search/search.html.erb", { query: query, render_search_results: render_search_results });
    // maybe load the search query results, too
    api.page.render({ content: template_str, socket: true});
  },

  socket: function(s) {
    s.on("query", function(q) {
      find_posts(q, function(results) {
        s.emit("queryresults", _.last(results, 30), q, Date.now());

      });
    });
  
  }
};
