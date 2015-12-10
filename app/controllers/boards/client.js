"use strict";

var post_utils = require("app/client/post_utils");
var settings = require("app/client/settings");
var notif = require("app/client/notif");
var chat = require("app/client/chat");
var emojies = require("app/client/emojies");
var storage = require("app/client/storage");
var favorites = require("app/client/favorite_boards");

var newthread = require("app/client/newthread");

var IMGUR_KEY;

require("app/client/drawing");
module.exports = {
  events: {
    "click .boardview .boardtiles" : "show_board_tiles",
    "click .boardview .boardfull" : "show_board_full",
    "click .boardview .boardlist" : "show_board_list",
    "click .post .title h4" : "click_post_title",
    "click .toggle_favorite" : "toggle_fav"
  },
  star_board: function() {
    favorites.add_favorite(this.board);
    this.$el.find(".toggle_favorite").removeClass("icon-star-empty").addClass("icon-star");
  },
  unstar_board: function() {
    favorites.del_favorite(this.board);
    this.$el.find(".toggle_favorite").addClass("icon-star-empty").removeClass("icon-star");
  },
  is_favorite: function() {
    var board = this.board;
    var favs = favorites.get();
    return _.contains(favs, board);

  },
  toggle_fav: function() {
    if (this.is_favorite()) {
      this.unstar_board();
    } else {
      this.star_board();

    }

  },
  sent_posts: function() {
    this.loaded_posts = true;
    SF.trigger("board_loaded_posts");
  },

  show_board_tiles: function() {
    $(".post").addClass("tile");
    $(".post").removeClass("tilerow");

    storage.set("boardstyle", "tile");

    SF.trigger("set_boardstyle", "tile");
  },
  show_board_full: function() {
    $(".post").removeClass("tilerow tile");
    storage.set("boardstyle", "");
    SF.trigger("set_boardstyle", "");

  },
  show_board_list: function() {
    $(".post").addClass("tilerow");
    $(".post").removeClass("tile");
    storage.set("boardstyle", "tilerow");
    SF.trigger("set_boardstyle", "tilerow");
  },
  show_board_header: function() {
    this.$el.find(".boardheader").show();
    var boardstyle = storage.get("boardstyle") || "";
    this.$el.find(".newthread").removeClass("btn");
    SF.trigger("set_boardstyle", boardstyle);
  },
  hide_board_header: function() {
    this.$el.find(".boardheader").hide();
    this.$el.find(".newthread").addClass("btn");
  },
  click_post_title: function(e) {
    var target = $(e.target).closest(".post");
    var linklink = $(e.target).closest(".linklink, .titlelink");
    if (linklink.length) {
      return;
    }

    // to pretend like we went to a URL
    var post_id = target.data("post-id");
    if (post_id) {
      e.preventDefault();
      e.stopPropagation();

      var url = window.location.pathname.match(post_id);
      if (url) {
        return;
      }

      SF.go("/p/" + post_id);
      SF.inform("popstate");

    }
  },
  no_posts: function() {
    $(".loading").html("<h2>there are no posts on this board, plz make some</h2>");
  },
  fix_chat: function() {
    $(".chat .post").removeClass("tile tilerow");
  },
  popstate: function() {
    var pathname = window.location.pathname;
    var boardstyle = storage.get("boardstyle") || "";
    if (pathname.indexOf("/b/") === 0) { // we are showing a board
      this.show_board_header();
      $(".post").show().removeClass("tile tilerow").addClass(boardstyle);
      _.each(window._POSTS, function(post) {
        post.collapse();
      });
      this.fix_chat();
    } else if (pathname.indexOf("/p/") === 0) { // we are showing a post
      var postId = pathname.slice(3);
      postId = parseInt(postId, 10);
      var post = window._POSTS[postId];
      if (post) {
        $(".post").hide();
        $(".chat .post").show();
        this.hide_board_header();
        post.expand();
        post.$el.find(".post")
          .removeClass("tile tilerow")
          .fadeIn(function() { 
            _.defer(function() { post.bumped(); });
            SF.controller().emit("isdoing", { what: "focused", post_id: postId });
        
          });

      } else {
        window.location.reload();
      }

    } else {
      // dunno what to do
      console.log("POPPED STATE TO WHERE?");
    }

  },
  init: function() {
    this.init_tripcodes();
    SF.trigger("board_ready");

    SF.subscribe("popstate", _.bind(this.popstate, this));

    var lastTime = (new Date()).getTime();
    var textarea = this.$el.find(".new_post textarea[name='text']");
    emojies.add_textcomplete(textarea);
    var self = this;

    SF.on("set_boardstyle", _.throttle(function(boardstyle) {
      self.fix_chat();
      $(".boardview a").removeClass("active");
      var boardlink;
      if (boardstyle === "tile") {
        boardlink = "boardtiles";

      } else if (boardstyle === "tilerow") {
        boardlink = "boardlist";

      } else {
        boardlink = "boardfull";
      }
      $(".boardview a." + boardlink).addClass("active");
    }, 100));

    // http://stackoverflow.com/questions/4079115/can-any-desktop-browsers-detect-when-the-computer-resumes-from-sleep
    // if the page becomes inactive for long enough, reload it on the next focus
    setInterval(function() {
      var currentTime = (new Date()).getTime();
      if (currentTime > (lastTime + 65000)) {  // ignore small delays
        window.bootloader.refresh();
      }
      lastTime = currentTime;
    }, 2000);

  },
  socket: function(s) {
    var added = {};
    notif.subscribe();
    s.on("new_post", function(data) {
      if (added[data.post_id]) {
        return;
      }
      added[data.post_id] = true;

      $C("post", data, function(cmp) {
        $(".posts").prepend(cmp.$el);
        cmp.gen_tripcodes();
        cmp.add_markdown();
      });
    });

    chat.add_socket_subscriptions(s);
    settings.add_socket_subscriptions(s);
    s.on("doings", function(data) {
      var post = window._POSTS[data.post_id];
      if (post) {
        post.update_counts(data.counts);
      }

    });

    s.on("update_post", function(post_id, text) {
      post_utils.update_post(post_id, text);
    });

    s.on("shake_post", function(post_id, duration) {
      var post = window._POSTS[post_id];
      if (post) {
        post.shake(duration);
      }
    });

    s.on("new_reply", function(data) {
      var post = window._POSTS[data.parent_id];
      if (post) {
        post.add_reply(data);
      }
    });

    s.on("joined", function(c) {
      console.log("Joined the board", c);
    });

    s.on("notif", function(msg, type, options) {
      notif.handle_notif(msg, type, options);
    });
    
    var self = this;
    self.do_when(self.board, "set_board", function() {
      if (self.board === "to") {
        s.emit("join", "a");
        s.emit("join", "b");
      } else {
        s.emit("join", self.board);
      }
    });
  },
};

_.extend(module.exports, chat);
_.extend(module.exports.events, chat.controller_events);
_.extend(module.exports, settings);
_.extend(module.exports.events, settings.controller_events);

_.extend(module.exports, newthread);
_.extend(module.exports.events, newthread.controller_events);

module.exports.set_board = function(b) {

  console.log("Seeing whats up for board", "/" + b);
  this.board = b;

  var title = window.bootloader.storage.get("newpost_title_" + b);
  var text = window.bootloader.storage.get("newpost_text_" + b);

  this.$el.find(".new_post input[name='title']").val(title);
  this.$el.find(".new_post textarea").val(text);

  if (this.is_favorite()) {
    this.star_board();
  }
  SF.trigger("set_board");

};
