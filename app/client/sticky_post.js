module.exports = {
  set_starred: function(post_id, no_load) {
    if (!post_id) {
      return;
    }

    if (!window._POSTS) {
      var self = this;
      setTimeout(function() {
        module.exports.set_starred(post_id, no_load);
      }, 100);
      return;
    }

    if (!window._POSTS[post_id]) {

      if (no_load) {
        setTimeout(function() { module.exports.set_starred(post_id, no_load); }, 1000);
      } else {
        SF.socket().emit("get_post", post_id, function(post) {
          post.post_id = post.id;
          $C("post", post, function(cmp) {
            $(".posts").prepend(cmp.$el);
            cmp.star();
            cmp.add_markdown();
            cmp.gen_tripcodes();
            cmp.$el.fadeIn();
          });
        });
      }
    } else {
      window._POSTS[post_id].star();
    }



  },
};
