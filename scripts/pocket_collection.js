var superfluous = require("superfluous");
var anon_pocket = require_app("server/anon_pocket");
var Post = require_app("models/post");

function collect_links() {
  Post.findAll({ }).success(posts => {
    _.each(posts, post => {
      anon_pocket.find_and_create_items(post);
    });
  });
}

module.exports = {
  collect_links
};


collect_links();
