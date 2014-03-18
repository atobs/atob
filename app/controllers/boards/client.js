"use strict";

require("core/client/component");

module.exports = {
  events: {
    "submit form.new_post" : "add_post",
    "change input.tripcode" : "save_tripcode",
    "change input.handle" : "save_handle",
    "change input.newtrip" : "save_newtrip"
  },
  save_newtrip: function() {
    var newtripEl = this.$page.find("input.newtrip");
    var newtrip = !!newtripEl.prop('checked');
    $.cookie("newtrip", newtrip);
  },
  save_tripcode: function() {
    var tripcodeEl = this.$page.find("input.tripcode");
    var tripcode = tripcodeEl.val();
    this.save_newtrip();
    $.cookie("tripcode", tripcode);
  },
  save_handle: function() {
    var handleEl = this.$page.find("input.handle");
    var handle = handleEl.val();
    this.save_newtrip();
    $.cookie("handle", handle);
  },
  add_post: function(e) {
    e.preventDefault();

    var serialized = $(e.target).serializeArray();
    var datas = {};
    _.each(serialized, function(obj) {
      datas[obj.name] = obj.value;
    });

    var tripcode = this.get_tripcode();
    var handle = this.get_handle();

    datas.tripcode = tripcode;
    datas.author = handle;

    if (datas.title.trim() === "" && datas.text.trim() === "") {
      return;
    }

    $(e.target).find("input").val("");

    SF.socket().emit("new_post", datas);
  },
  init: function() {
    var tripcodeEl = this.$page.find("input.tripcode");
    var handleEl = this.$page.find("input.handle");
    var newtripEl = this.$page.find("input.newtrip");
    var newtrip = $.cookie("newtrip") === "true";
    tripcodeEl.chromaHash({bars: 4});
    var tripcode = $.cookie("tripcode");
    var handle = $.cookie("handle");

    if (newtrip) {
      newtripEl.prop('checked', true);
    }

    if (tripcode && !newtrip) {
      tripcodeEl.val(tripcode);
    }
    if (handle) {
      handleEl.val(handle);
    }

    this.save_tripcode();
    $(".timeago").timeago();

  },
  set_board: function(b) {
    console.log("Seeing whats up for board", "/" + b);
    this.board = b;
    this.trigger("set_board");
  },
  get_tripcode: function() {
    return md5($("input.tripcode").val());
  },
  get_handle: function() {
    return $("input.handle").val();
  },
  socket: function(s) {
    s.on("new_post", function(data) {
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

    s.on("new_reply", function(data) {
      var post = window._POSTS[data.parent_id];
      post.add_reply(data);

      var focusedPost = $(document.activeElement).parents(".post");
      if (post.$el.find(".post")[0] !== focusedPost[0]) {
        // Need to route it to the right post, somehow

        var parent = post.$el.parent();
        post.$el.stop(true, true).fadeOut(function() {
          parent.prepend(post.$el);
          post.$el.fadeIn();
        });

      }

    });

    s.on("joined", function(c) {
      console.log("Joined the board", c);
    });

    var self = this;
    self.do_when(self.board, "set_board", function() {
      s.emit("join", self.board);
    });
  }
};
