var superfluous = require("superfluous");
var anon_pocket = require_app("server/anon_pocket");
var Post = require_app("models/post");

function collect_links() {
  Post.findAll({ }).success(function(posts) {
    _.each(posts, function(post) {
      anon_pocket.find_and_create_items(post);
    });
  });
}

module.exports = {
  collect_links: collect_links
};


collect_links();
