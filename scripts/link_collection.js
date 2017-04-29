var superfluous = require("superfluous");
var post_links = require_app("server/post_links");
var Post = require_app("models/post");

function collect_links() {
  Post.findAll({ }).success(posts => {
    _.each(posts, post => {
      post_links.find_and_create_links(post);
    });
  });
}

module.exports = {
  collect_links
};


collect_links();
