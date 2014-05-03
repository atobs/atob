"use strict";

require("core/client/component");
var settings = require("app/client/settings");
var notif = require("app/client/notif");

module.exports = {
  events: {
    "submit form.new_post" : "add_post",
    "change input.tripcode" : "save_tripcode",
    "change input.handle" : "save_handle",
    "keyup input.tripcode" : "update_trip_colors",
    "keyup input.handle" : "update_trip_colors",
    "blur .new_post input" : "remove_post_preview",
    "blur .new_post textarea" : "remove_post_preview",
    "focus .new_post input" : "update_post_preview",
    "focus .new_post textarea" : "update_post_preview",
    "keyup .new_post input" : "update_post_preview",
    "keyup .new_post textarea" : "update_post_preview",
    "change input.newtrip" : "save_newtrip",
    "click .identity_tripcode" : "regen_tripcode",
    "click .regen_tripcode" : "regen_tripcode",
    "click .tripcode_button" : "restore_old_code",
    "click .tripcode_delete" : "delete_old_code",
    "click .tripcode_history" : "tripcode_history"
  },
  update_post_preview: _.throttle(function(e) {
    var title = this.$el.find(".new_post input").val();
    var text = this.$el.find(".new_post textarea").val();
    var escaped_text = $("<div />").text(text).html();

    var preview = this.$el.find(".post_preview");
    preview.stop().fadeIn();

    if (!preview.is(":visible")) {
      return;
    }

    if (!title.trim() && !text.trim()) {
      preview.empty();
      return;
    }

    // Need to save the post preview, i guess?

    window.bootloader.storage.set("newpost_title_" + this.board, title);
    window.bootloader.storage.set("newpost_text_" + this.board, text);

    $C("post", { 
      title: title, 
      text: escaped_text, 
      ups: 0, 
      downs: 0, id: "preview",
      author: this.get_handle(),
      tripcode: this.get_trip_identity()
    }, function(cmp) {
      preview.empty();
      preview.append(cmp.$el);
    });
  }, 200),

  remove_post_preview: function() {
    $(".post_preview").stop(true, true).fadeOut();

    var title = this.$el.find(".new_post input").val();
    var text = this.$el.find(".new_post textarea").val();
    window.bootloader.storage.set("newpost_title_" + this.board, title);
    window.bootloader.storage.set("newpost_text_" + this.board, text);
  },
  add_post: function(e) {
    e.preventDefault();

    var serialized = $(e.target).serializeArray();
    var datas = {};
    _.each(serialized, function(obj) {
      datas[obj.name] = obj.value;
    });

    var tripcode = this.get_tripcode();
    var triphash = this.get_triphash();
    var handle = this.get_handle();

    datas.tripcode = triphash;
    datas.author = handle;
    datas.board = this.board;

    if (datas.title.trim() === "" && datas.text.trim() === "") {
      return;
    }

    $(e.target).find("input, textarea").val("");
    $(".post_preview").fadeOut(function() {
      $(this).empty(); 
    });

    SF.socket().emit("new_post", datas);
    this.remember_tripcode(handle, tripcode);
    window.bootloader.storage.delete("newpost_title_" + this.board);
    window.bootloader.storage.delete("newpost_text_" + this.board);
  },
  init: function() {
    this.init_tripcodes();
    SF.trigger("board_ready");

    var lastTime = (new Date()).getTime();

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
  set_board: function(b) {
    console.log("Seeing whats up for board", "/" + b);
    this.board = b;
    this.trigger("set_board");

    var title = window.bootloader.storage.get("newpost_title_" + b);
    var text = window.bootloader.storage.get("newpost_text_" + b);

    this.$el.find(".new_post input").val(title);
    this.$el.find(".new_post textarea").val(text);

  },
  socket: function(s) {
    var added = {};
    s.on("new_post", function(data) {
      if (added[data.post_id]) {
        return;
      }
      added[data.post_id] = true;

      $C("post", data, function(cmp) {
        $(".posts").prepend(cmp.$el);
      });
    });

    s.on("doings", function(data) {
      var post = window._POSTS[data.post_id];
      if (post) {
        post.update_counts(data.counts);
      }

    });

    s.on("update_post", function(post_id, text) {
      var replyEl = $("#reply" + post_id).children("small.text");
      if (!text) {
        replyEl.parent().fadeOut();
        return;
      }

      require("app/client/text", function(formatter) {
        var replyContainer = $("<div />");
        replyContainer.text(text);
        formatter.format_text(replyContainer);

        replyEl.fadeOut(1000, function() {
          replyEl.empty();
          replyEl.append(replyContainer);
          replyEl.fadeIn();
        });
      });

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
      s.emit("join", self.board);
    });
  }
};

_.extend(module.exports, settings);
