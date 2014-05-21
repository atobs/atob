var superfluous = require("superfluous");
var post_links = require_app("server/post_links");
var Post = require_app("models/post");

function collect_links() {
  Post.findAll({ }).success(function(posts) {
    _.each(posts, function(post) {
      post_links.find_and_create_links(post);
    });
  });
}

module.exports = {
  collect_links: collect_links
};


collect_links();
