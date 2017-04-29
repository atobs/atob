var superfluous = require("superfluous");

var Post = require_app("models/post");
var ArchivedPost = require_app("models/archived_post");
var Action = require_app("models/action");
var Board = require_app("models/board");
var BoardConfig = require_app("models/board_config");
var IP = require_app("models/ip");
var HIDDEN_BOARDS = require_app("server/hidden_boards");

var MAX_POSTS = 30;
var ONE_WEEK = (1000 * 60 * 60 * 24 * 7);

function collect_garbage() {
  var one_week_ago = new Date(+new Date() - ONE_WEEK);
  var one_month_ago = new Date(+new Date() - ONE_WEEK * 4);
  IP.destroy({
    created_at: {
      lt: one_week_ago.toISOString()
    }
  });

  // For now, we keep actions in the DB until they get to be too much
  //  Action.destroy({
  //    updated_at: {
  //      lt: one_month_ago.toISOString()
  //    }
  //  });

  // Destroy all posts on chat board older than one month
  Post.destroy({
    created_at: {
      lt: one_month_ago.toISOString()
    },
    board_id: {
      eq: "chat"
    }
  });


  // Destroy all posts past the board limits
  Post.findAll({
    where: {
      thread_id: null,
      parent_id: null
    }
  }).success(posts => {
    var by_board = _.groupBy(posts, b => b.board_id);

    _.each(by_board, (val, key) => {
      // let's not clean up any hidden boards for now
      if (_.contains(HIDDEN_BOARDS, key)) {
        console.log("SKIPPING BOARD", key, val.length);
        return;
      }


      BoardConfig.find({where: {board_id: key }}).success(board_config => {
        if (val.length > MAX_POSTS) {
          console.log("BOARD HAS TOO MANY POSTS", key, val.length);
          var sorted = _.sortBy(val, v => -v.bumped_at || -v.updated_at);

          var keep_posts = sorted.slice(0, MAX_POSTS);
          var delete_posts = sorted.slice(MAX_POSTS, sorted.length);

          console.log("TO KEEP POSTS", keep_posts.length);

          _.each(delete_posts, post => {
            if (board_config && board_config.getSetting("starred") === post.id) {
              console.log("SAVING STARRED POST", post);
              return;
            }
            var archive = false;
            if ((post.replies - post.downs) > 50 || post.ups > 10) {
              console.log(post.replies, post.ups);
              archive = true;
              ArchivedPost.findOrCreate({ id: post.id }, post.dataValues);
            }

            post.destroy();
            post.getChildren().success(children => {
              console.log("CHILDREN IDS ARE", _.map(children, p => p.id));

              if (archive) {
                _.each(children, p => {
                  ArchivedPost.findOrCreate({ id: p.id }, p.dataValues);
                });
              }

              Post.destroy({
                parent_id: post.id
              });
            });

          });

        }

      });

    });
  });
}

module.exports = {
  collect_garbage
};


collect_garbage();
