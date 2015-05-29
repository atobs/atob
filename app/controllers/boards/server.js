"use strict";

var Post = require_app("models/post");
var Board = require_app("models/board");
var Link = require_app("models/link");

var $ = require("cheerio");

var gen_md5 = require_app("server/md5");
var posting = require_app("server/posting");
var post_links = require_app("server/post_links");
var mod = require_app("server/mod");
var config = require_core("server/config");
var sponsored_content = require_app("server/sponsored_content");

var makeme_store = require_app("server/makeme_store");

var BOARD_SLOGANS = {
  "a" : "is for anon",
  "b" : "is for banal",
  "to" : "random anon is random",
  "gifs" : "and other pics"
};

var board_utils = require_app("server/board_utils");

module.exports = {
  // If the controller has assets in its subdirs, set is_package to true
  is_package: false,
  routes: {
    "/:id" : "show",
  },

  index: function(ctx, api) {
    api.page.render({
      content: "Nothing to see here"
    });
  },
  show: function(ctx, api) {
    var board_id = ctx.req.params.id;
    this.set_title("atob/" + board_id);

    var specials = [ "links", "archives", "gifs", "chat" ];
    var redir;
    _.each(specials, function(board) {
      if (board_id === board) {
        ctx.res.redirect("/" + board);
        redir = true;
      }
    });

    if (redir) {
      return;
    }

    // make sure it stays up to date
    $C("delete_post_modal", {}).marshall();

    api.template.add_stylesheet("board.css");
    var render_boards = board_utils.render_boards();

    var board_id_clause = board_id;
    var board_slogan = BOARD_SLOGANS[board_id] || "";
    var limit = 30;
    var order_clause = "bumped_at DESC";
    if (board_id === "to") {
      board_id_clause = null;
      order_clause = "created_at DESC";
      limit = 300;
    } else if (board_id === "heretics") {
      order_clause = "created_at DESC";
    }

    var where = {};
    if (board_id_clause) {
      where.board_id = board_id_clause;
    }
    where.thread_id = null;

    var render_posts = api.page.async(function(flush) {
      Post.findAll({
          where: where,
          order: order_clause,
          limit: limit
      }).success(function(results) {
        if (!results || !results.length) {
          api.bridge.controller("boards", "no_posts");
          return flush();
        }

        if (board_id === "to") {
          
          results = _.filter(results, function(r) { 
            var is_hidden = false;
            _.each([ "heretics", "faq", "bugs", "log", "mod", "cop", "ban", "test"], function(board) {
              is_hidden = is_hidden || board === r.board_id;
            });

            return !is_hidden;
          });

          results = _.shuffle(results);
        }

        var div = $("<div></div>");

        // add an old post, for fun
        var grabbag = results[_.random(10, results.length-1)];
        results = results.slice(0, 11);
        if (grabbag) {
          results.push(grabbag);
        }

        _.each(results, function(result) {
          var async_work = api.page.async(function(flush_post) {
            result.getChildren().success(function(children) {
              var post_data = result.dataValues;
              post_data.post_id = post_data.id;
              delete post_data.id;
              post_data.replies = _.map(children, function(c) { return c.dataValues; } );
              post_data.replies = _.sortBy(post_data.replies, function(d) {
                return d.id;
              });

              var client_options = _.clone(post_data);
              post_data.client_options = client_options;
              posting.trim_post(client_options);

              post_links.freshen_client(post_data.post_id, children, function() {
                var postCmp = $C("post", post_data);
                var text_formatter = require_root("app/client/text");
                postCmp.add_markdown(text_formatter);
                var tripcode_gen = require_app("server/tripcode");
                postCmp.gen_tripcodes(tripcode_gen.gen_tripcode);

                flush_post(postCmp.toString());
              });

            });
          });

          div.append(async_work());
        });

        flush(div);
      });
    });

    var render_sinners = api.page.async(function(flush) {
      Post.findAll({
        where: {
          board_id: "heretics"
        }
      }).success(function(results) {
        var sinners = _.map(results, function(r) { return r.dataValues; });
        api.bridge.call("app/client/sinners", "punish", sinners);
        flush();
      });
    });
    render_sinners();

    var render_sponsored_content = sponsored_content.render(api);

    var template_str = api.template.render("controllers/boards/show.html.erb", {
      board: board_id,
      tripcode: gen_md5(Math.random()),
      render_posts: render_posts,
      render_boards: render_boards,
      board_slogan: board_slogan,
      render_sponsored_content: render_sponsored_content,
      new_thread: board_id !== "to"
    });

    api.bridge.controller("boards", "set_board", board_id);
    api.bridge.controller("boards", "set_api_key", config.imgur_key);
    var rss_str = api.template.partial("rss.html.erb", { board: board_id });
    this.add_to_head(rss_str);

    api.page.render({
      content: template_str,
      socket: true,
      component: true
    });

  },

  socket: function(s) {
    var _board;

    var joined = {};
    s.on("join", function(board) {
      s.board = board;
      if (joined[board]) {
        return;
      }

      joined[board] = true;
      makeme_store.lurk(s, board);
      s.spark.join(board);
      _board = board;
      s.emit("joined", board);
    });

    s.on("update_post", function(post, cb) {
      var board = post.board || _board;
      posting.handle_update_post(s, board, post, cb);
    });

    s.on("delete_post", function(post) {
      var board = post.board || _board;
      // Special case mod postings
      posting.handle_delete_post(s, board, post);
    });

    s.on("new_post", function(post, cb) {
      var board = post.board || _board;
      // Special case mod postings
      if (board === "mod") {
        mod.handle_new_post(s, post);  
      } else {
        posting.handle_new_post(s, board, post, cb);
      }
    });

    s.on("new_reply", function(post, cb) {
      posting.handle_new_reply(s, _board, post, cb);
    });

    s.on("upboat", function(link, cb) {
      post_links.upvote_link(link, cb);
    });



    makeme_store.subscribe_to_updates(s);

  },

  handle_new_reply: posting.handle_new_reply,
  handle_new_post: posting.handle_new_post,
  BOARD_SLOGANS: BOARD_SLOGANS
};
