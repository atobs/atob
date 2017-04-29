var Post = require_app("models/post");
var posting = require_app("server/posting");
var render_posting = posting.render_posting;
var board_names = require_app("server/board_names");

module.exports = {
  render_recent(api) {
    return api.page.async(flush => {
      Post.findAll({
        where: {
          board_id: {
            eq: board_names.CHAT
          },
        },
        order: "id DESC",
        limit: 30
      }).success(posts => {
        // Find the most recent thread
        var parent = null;
        _.each(posts, post => {
          if (post && !post.dataValues.parent_id && !parent) {
            parent = post;
          }
        });


        if (!parent && posts.length) {
          parent = posts[posts.length - 1];
        }

        if (!parent) {
          return flush("");
        }

        parent.children = posts;
        render_posting(api, flush, parent, null /* highlight_id */, true /* nothreading! */);

        api.bridge.call("app/client/chat", "show_chat", parent.dataValues.post_id);
      });
    });
  }
};
