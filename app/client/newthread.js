var storage = require("app/client/storage");

function handle_imgur_upload(textareaEl, file, cb) {
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

      if (cb) {
        cb();
      }

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

      if (cb) {
        cb();
      }
    };
    xhr.setRequestHeader('Authorization', "Client-ID " + IMGUR_KEY); // Get your own key http://api.imgur.com/
    xhr.send(fd);
  }

  set_upload_state();
  real_imgur_request();
//  stub_imgur_request();


}

module.exports = {
  controller_events: {
    "submit form.new_post" : "add_post",
    "click form.new_post .submit" : "add_post_force",
    "change .new_post input.photoupload" : "handle_upload_image",
    "click .upload_photo": "click_upload_image",
    "blur .new_post input" : "remove_post_preview",
    "blur .new_post textarea" : "remove_post_preview",
    "focus .new_post input" : "update_post_preview",
    "focus .new_post textarea" : "update_post_preview",
    "keyup .new_post input" : "update_post_preview",
    "keyup .new_post textarea" : "update_post_preview",
    "click .newthread" : "handle_click_newthread"
  },
  handle_click_newthread: function() {
    $("html, body").animate({scrollTop: 0});
  },

  update_post_preview: _.throttle(function(e) {
    var title = this.$el.find(".new_post input[name='title']").val();
    var text = this.$el.find(".new_post textarea").val();
    var escaped_text = $("<div />").text(text).html();

    var preview = this.$el.find(".post_preview");
    preview.stop().fadeIn();

    SF.controller().emit("isdoing", { what: "newthread" });
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

    var children = preview.children();
    $C("post", {
      title: title,
      text: escaped_text,
      ups: 0,
      downs: 0, id: "preview",
      author: this.get_handle(),
      tripcode: this.get_trip_identity()
    }, function(cmp) {
      cmp.gen_tripcodes();
      cmp.add_markdown();
      cmp.$el.find(".tile, .tilerow").removeClass("tile tilerow");
      preview.prepend(cmp.$el);

      setTimeout(function() {
        children.remove();
      });
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

    SF.socket().emit("new_post", datas, function(id) {
      if (id) {
        window.location.href = "/p/" + id;
      }
    
    });
    this.remember_tripcode(handle, tripcode);
    window.bootloader.storage.delete("newpost_title_" + this.board);
    window.bootloader.storage.delete("newpost_text_" + this.board);
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
    } else if (pathname.indexOf("/p/") === 0) { // we are showing a post
      var postId = pathname.slice(3);
      postId = parseInt(postId, 10);
      var post = window._POSTS[postId];
      if (post) {
        $(".post").hide();
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
  is_file_upload: function(e) {
    /* Is the file an image? */
    var files = e.target.files;
    var file = files[0];
    if (!file || !file.type.match(/image.*/)) return false;

    return true;


  },
  // FROM: https://github.com/paulrouget/miniuploader/blob/gh-pages/index.html
  handle_upload_image: function(e) {
    
    var self = this;
    if (!self.is_file_upload(e)) {
      return;
    }

    e.preventDefault();

    // now do we add the image to the post?
    var textareaEl = this.$el.find(".new_post textarea");

    handle_imgur_upload(textareaEl, e.target.files[0], function() {
      self.update_post_preview();
    });
  },
  set_api_key: function(key) {
    IMGUR_KEY = key;
  },
  click_upload_image: function() {
    this.$el.find(".new_post .photoupload").click();
  },
  click_post_title: function(e) {
    var target = $(e.target).closest(".post");
    var linklink = $(e.target).closest(".linklink");
    if (linklink.length) {
      return;
    }

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
  handle_imgur_upload: handle_imgur_upload




}
