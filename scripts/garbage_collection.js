var superfluous = require("superfluous");

var Post = require_app("models/post");
var Board = require_app("models/board");
var IP = require_app("models/ip");

var MAX_POSTS = 30;
var ONE_WEEK = (1000 * 60 * 60 * 24 * 7);

function collect_garbage() {
  var one_week_ago = new Date(+new Date() - ONE_WEEK);
  IP.destroy({
    created_at: {
      lt: one_week_ago.toISOString()
    }
  });

  Post.findAll({
    where: {
      thread_id: null,
      parent_id: null
    }
  }).success(function(posts) {
    var by_board = _.groupBy(posts, function(b) {
      return b.board_id;
    });

    _.each(by_board, function(val, key) {

      if (val.length > MAX_POSTS) {
        console.log("BOARD HAS TOO MANY POSTS", key, val.length);
        var sorted = _.sortBy(val, function(v) {
          return -v.bumped_at;
        });

        var keep_posts = sorted.slice(0, MAX_POSTS);
        var delete_posts = sorted.slice(MAX_POSTS, sorted.length);

        console.log("TO KEEP POSTS", keep_posts.length);

        _.each(delete_posts, function(post) {
          post.destroy();
          Post.destroy({
            parent_id: post.id
          });

          post.getChildren().success(function(children) {
            console.log("CHILDREN IDS ARE", _.map(children, function(p) { return p.id; }));
          });
        });

      }

    });
  });
}

module.exports = {
  collect_garbage: collect_garbage
};


collect_garbage();
