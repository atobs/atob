"use strict";

var settings = require("app/client/settings");
var post_utils = require("app/client/post_utils");
var notif = require("app/client/notif");
var chat = require("app/client/chat");

require("app/client/drawing");

var newthread = require("app/client/newthread");

window._POSTS = window._POSTS || {};
module.exports = {
  events: {
    "click .post .title h4" : "post_title_click"

  },
  post_title_click(e) {
    var linklink = $(e.target).closest(".linklink, .titlelink");
    if (linklink.length) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    return;

  },
  init() {
    this.init_tripcodes();


    var current_location = window.location.pathname;
    SF.subscribe("popstate", () => {
      if (window.location.pathname !== current_location) { 
        window.location.reload();
      }
    });
  },
  goto_chat() {
    window.location = "/chat";
  },
  focus_post(id) {
    var self = this;
    var params = $.deparam(window.location.search.substr(1));

    setTimeout(() => {
      var dest = $("#reply" + id).filter(":visible");
      if (params.e) {
        dest = $("form.replyform");
        $("form.replyform textarea").focus();
      } 

      if (!dest.length) {
        self.focus_post(id);
      } else {
        $("body").scrollTo(dest, { duration: 400, offset: { top: -100 } });
      }

    }, 50);
  },
  socket(s) {
    var self = this;
    notif.subscribe(s);

    chat.add_socket_subscriptions(s);
    settings.add_socket_subscriptions(s);
    s.on("doings", data => {
      var post = window._POSTS[data.post_id];
      if (post) {
        post.update_counts(data.counts, data.last_seen);
      }

    });

    s.on("new_reply", data => {
      var post = window._POSTS[data.parent_id];
      if (post) {
        post.add_reply(data);
      }
    });

    s.on("joined", c => {
      console.log("Joined the board", c);
    });

    s.on("shake_post", (post_id, duration) => {
      var post = window._POSTS[post_id];
      if (post) {
        post.shake(duration);
      }
    });

    s.on("update_post", (post_id, text) => {
      post_utils.update_post(post_id, text);
    });

    s.on("notif", (msg, type, options) => {
      notif.handle_notif(msg, type, options);
    });

    var self = this;
    self.do_when(self.board, "set_board", () => {
      s.emit("join", self.board);
    });

    var post_id = $(".post").data("post-id");
    s.emit("isdoing", { what: "focused", post_id });
  },
  goto(url) {
    // redirecting
    window.location = url;
  },
  hide_loading() {
    $(".loading").fadeOut();
  }
};

_.extend(module.exports, chat);
_.extend(module.exports.events, chat.controller_events);

_.extend(module.exports, settings);
_.extend(module.exports.events, settings.controller_events);

_.extend(module.exports, newthread);
_.extend(module.exports.events, newthread.controller_events);
