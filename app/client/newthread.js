var storage = require("app/client/storage");

var handle_imgur_upload = require("app/client/imgur");
var favorites = require("app/client/favorite_boards");

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
    "click .toptop" : "handle_click_toptop"
  },
  handle_click_toptop: function() {
    
    favorites.render_favorites();
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

   
    var self = this;
    SF.socket().emit("new_post", datas, function(id) {
        self.goto_post(id);
    });
    this.remember_tripcode(handle, tripcode);
    window.bootloader.storage.delete("newpost_title_" + this.board);
    window.bootloader.storage.delete("newpost_text_" + this.board);
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
};
