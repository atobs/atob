"use strict";

var tabOpenTime = Date.now();
var NOTIFY_WHEN = "always";
var favorites = require("app/client/favorite_boards");
var storage = require("app/client/storage");

navigator.vibrate = navigator.vibrate ||
  navigator.webkitVibrate ||
  navigator.mozVibrate || 
  navigator.msVibrate;

function notify_level(post) {
  NOTIFY_WHEN = storage.get("notify_when");
  if (NOTIFY_WHEN === "boards") {
    // check the board subscription list...
    var favs = favorites.get();
    if (!_.contains(favs, post.board_id || post.board)) {
      return;
    }

  }

  if (NOTIFY_WHEN === "posts") {
    if (post.parent_id) {
      return;
    }
  }

  if (NOTIFY_WHEN === "page") {
    if (post.parent_id && !window._POSTS[post.parent_id]) {
      return;
    }
    
  }

  if (NOTIFY_WHEN === "never") { return; }

  return true;
}

function _notify_user(title, options, post) {
  options = options || {};
  options.icon = "/favicon.ico";
  options.tag = "atob";

  if (!post) {
    post = {
      id: 'unknown'
    };
  }

  var notification;

  if (window.localStorage) {
    var notified = window.localStorage.getItem("notif" + post.id);
    if (!notified) {
      window.localStorage.setItem("notif" + post.id, tabOpenTime);
      setTimeout(function() {
        _notify_user(title, options, post);
      }, 200);
      return;
    }

    if (notified !== String(tabOpenTime)) {
      // This tab didn't grab it
      return;
    } else {
      window.localStorage.setItem("notif" + post.id, 1);
    }
    
  } 

  if (Notification.permission === "granted") {
    notification = new Notification(title, options);

  } else if (Notification.permission != "denied") {
    Notification.requestPermission(function (status) {
      if (Notification.permission != status) {
        Notification.permission = status;
      }

      if (status === "granted") {
        notification = new Notification(title, options);
      }

    });

  }

  if (notification) {
    notification.onshow = function () { 
      setTimeout(notification.close.bind(notification), 5000); 
    };

    notification.onclick = function () {
      window.open("/p/" + post.id, "_blank");
    };

    if (navigator.vibrate) {
      navigator.vibrate(400);
    }

    $(window).on("unload", function() {
      notification.close();
    });
    $(window).on("beforeunload", function() {
      notification.close();
    });


  }

}

function notify_user(title, options, post) {
  var my_trips;
  try {
    my_trips = SF.controller().get_trip_identities();
  } catch(e) { }

  // ignore posts we make, ideally
  if (_.contains(my_trips, post.tripcode)) {
    return;
  }

  // check NOTIFY_WHEN level...
  if (!notify_level(post)) {
    return;
  }
  

  // if document is hidden, we use the internal notify_user, otherwise we use the $.notif
  if (window.Notification && document.hidden) {
    _notify_user(title, options, post);
  } else {
    options.className = "success";
    var gotoEl = $("<div class='clearfix'><small class='rfloat' style='text-decoration: underline'>goto</small></div>");
    gotoEl.find("small").on("click", function() {
      SF.controller().goto_post(post.post_id);
    });
    if (!window._POSTS[post.parent_id]) {
      $.notify({ title: title, msg: options.body, goto: gotoEl } , { style: "notif" });
    }
  }

  SF.trigger("notify", title, options, post);
}

function convert_post_text(post, cb) {
  require("app/client/text", function(format_text) {
    var postEl = $("<span />");
    postEl.text(post.text);

    format_text.add_markdown(postEl);
    post.formatted_text = postEl.html();

    cb(post);
  });


}

function add_notification_handlers(s) {
  s.on("new_reply", function(reply) {
    convert_post_text(reply, function(reply) {
      notify_user("new reply on " + reply.parent_id + " (/" + reply.board_id + ")", {
        body: $("<div />").html(reply.formatted_text).text()
      }, reply);
    });

  });

  s.on("new_post", function(post) {
    convert_post_text(post, function(post) {
      var title = $("<div />").html(post.title).text();
      var text = $("<div />").html(post.formatted_text).text();
      notify_user("A new post to /" + post.board_id, {
        body: title + " " + text
      }, post);
    });
  });

}

module.exports = {
  handle_notif: function(msg, type, options) {
    options = options || {};
    options.className = type;
    options.position = "top right";
    $.notify(msg, options);
  },
  subscribe_to_socket: function(s) {
    add_notification_handlers(s);
  },
  set_notif_level: function(level) {
    NOTIFY_WHEN = level;
  },
  notify_user: notify_user,
  subscribe: function() {
    var s = SF.primus.channel("ctrl_home");
    // setup new_reply and new_post socket handlers
    this.subscribe_to_socket(s);
  }

};


$.notify.addStyle("notif", {
  html: "<div>\n"+
    "<div data-notify-text='title'></div>\n"+
    "<small><div data-notify-html='msg'> </div></small>\n" +
    "<div data-notify-html='goto'></div>\n"+
    "</div>",
  classes: {
    base: {
      "font-weight": "bold",
      "padding": "8px 15px 8px 14px",
      "text-shadow": "0 1px 0 rgba(255, 255, 255, 0.5)",
      "background-color": "#fefefe",
      "border": "1px solid #fbeed5",
      "white-space": "nowrap",
      "padding-left": "25px",
      "background-repeat": "no-repeat",
      "background-position": "3px 7px"
    }
  }
});
