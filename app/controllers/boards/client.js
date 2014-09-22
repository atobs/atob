"use strict";

require("core/client/component");
var post_utils = require("app/client/post_utils");
var settings = require("app/client/settings");
var notif = require("app/client/notif");

var IMGUR_KEY;

module.exports = {
  events: {
    "submit form.new_post" : "add_post",
    "click form.new_post .submit" : "add_post_force",
    "change input.tripcode" : "save_tripcode",
    "change input.handle" : "save_handle",
    "change input.photoupload" : "handle_upload_image",
    "click .upload_photo": "click_upload_image",
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
    var title = this.$el.find(".new_post input[name='title']").val();
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
      cmp.gen_tripcodes();
      cmp.add_markdown();
    });
  }, 200),

  remove_post_preview: function() {
    $(".post_preview").stop(true, true).fadeOut();

    var title = this.$el.find(".new_post input[name='title']").val();
    var text = this.$el.find(".new_post textarea").val();
    window.bootloader.storage.set("newpost_title_" + this.board, title);
    window.bootloader.storage.set("newpost_text_" + this.board, text);
  },
  add_post_force: function(e) {
    this.add_post(e, true);
  },
  no_posts: function() {
    $(".loading").html("<h2>there are no posts on this board, plz make some</h2>");
  },
  add_post: function(e, force) {
    e.preventDefault();
    var form = $(e.target).closest("form");

    var serialized = form.serializeArray();
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

    datas.force = force;

    if (datas.title.trim() === "" && datas.text.trim() === "") {
      return;
    }

    $(form).find("input, textarea").val("");
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

    this.$el.find(".new_post input[name='title']").val(title);
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
        cmp.gen_tripcodes();
        cmp.add_markdown();
      });
    });

    s.on("anons", this.handle_anonicators);
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
  click_upload_image: function() {
    this.$el.find(".photoupload").click();
  },
  // FROM: https://github.com/paulrouget/miniuploader/blob/gh-pages/index.html
  handle_upload_image: function(e) {
    var self = this;
    /* Is the file an image? */
    var files = e.target.files;
    var file = files[0];
    if (!file || !file.type.match(/image.*/)) return;

    e.preventDefault();

    // now do we add the image to the post?
    var textareaEl = this.$el.find(".new_post textarea");
    // add feedback to indiciate its uploading

    function set_upload_state() {
      textareaEl.attr("disabled", true);

    }

    function end_upload_state() {
      textareaEl.attr("disabled", false);
      setTimeout(function() {
        textareaEl.focus();
        moveCaretToEnd(textareaEl[0]);
        setTimeout(function() {
          moveCaretToEnd(textareaEl[0]);
          textareaEl.focus();
        });
      });
    }

    // from http://stackoverflow.com/questions/4715762/javascript-move-caret-to-last-character
    function moveCaretToEnd(el) {
      if (typeof el.selectionStart == "number") {
        el.selectionStart = el.selectionEnd = el.value.length;
      } else if (typeof el.createTextRange != "undefined") {
        el.focus();
        var range = el.createTextRange();
        range.collapse(false);
        range.select();
      }
    }

    
    function set_textarea_val(stub) {
      var val = textareaEl.val();
      textareaEl.val('').focus().val(val + stub);
    }

    function stub_imgur_request() {
      setTimeout(function() {
        var link = "/images/atobi.png";

        set_textarea_val(" ![my dumb photo](" + link + ") ");
        end_upload_state();
        self.update_post_preview();
      }, 1000);
    }

    function real_imgur_request() {
      /* Lets build a FormData object*/
      var fd = new FormData(); // I wrote about it: https://hacks.mozilla.org/2011/01/how-to-develop-a-html5-image-uploader/
      fd.append("image", file); // Append the file
      var xhr = new XMLHttpRequest(); // Create the XHR (Cross-Domain XHR FTW!!!) Thank you sooooo much imgur.com
      xhr.open("POST", "https://api.imgur.com/3/image.json"); // Boooom!
      xhr.onload = function() {
        var response = JSON.parse(xhr.responseText);
        var link = response.data.link;

        set_textarea_val(" ![my dumb photo](" + link + ") ");
        end_upload_state();
        self.update_post_preview();
      };
      xhr.setRequestHeader('Authorization', "Client-ID " + IMGUR_KEY); // Get your own key http://api.imgur.com/
      xhr.send(fd);
    }

    set_upload_state();
    real_imgur_request();
    
  },
  set_api_key: function(key) {
    IMGUR_KEY = key;
  }
  
};

_.extend(module.exports, settings);
