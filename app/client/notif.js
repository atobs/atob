"use strict";

var tabOpenTime = Date.now();

navigator.vibrate = navigator.vibrate ||
  navigator.webkitVibrate ||
  navigator.mozVibrate || 
  navigator.msVibrate;

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
      console.log("GOING TO NOTIFICATION", post.id);
      window.open("/p/" + post.id, "_system");
    };

    if (navigator.vibrate) {
      navigator.vibrate(400);
    }


  }

}

function notify_user(title, options, post) {
  var my_trip;
  try {
    my_trip = SF.controller().get_trip_identity();
  } catch(e) { }

  // ignore posts we make, ideally
  if (my_trip && post && my_trip === post.tripcode) {
    return;
  }

  if (window.Notification && (options.force || document.hidden)) {
    _notify_user(title, options, post);
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
      notify_user("reply to " + reply.parent_id + " on /" + reply.board_id, {
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
  notify_user: notify_user,
  subscribe: function() {
    var s = SF.primus.channel("ctrl_home");
    // setup new_reply and new_post socket handlers
    this.subscribe_to_socket(s);
  }

};
