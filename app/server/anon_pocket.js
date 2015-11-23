var Trophy = require_app("models/trophy");
var Post = require_app("models/post");
var HIDDEN_BOARDS = require_app("server/hidden_boards");

var POCKET_RE = /:hand-right:\s*(:[\w-]*:)\s*(?:\(.?\(\s*)?&gt;&gt;\s*(\d*)/;
module.exports = {
  find_and_create_items: function(post) {
    if (post.dataValues) {
      post = post.dataValues;
    }

    if (_.contains(HIDDEN_BOARDS, post.board_id)) {
      return;
    }

    var post_id = post.post_id || post.id;
    if (post_id) {
      Trophy.findAll({where: { anon_id: post_id }}).success(function (results) {
        _.each(results, function(r) { r.destroy(); }); 
      });
    }

    var groups = post.text.match(POCKET_RE);
    if (groups && groups[2]) {
      console.log("Adding trophy", groups[1], "in post", groups[2]);
      Post.find({ where: { id: groups[2] }}).success(function(pocket_post) {
        if (pocket_post) {
          // we found a post, therefore we can make this action!
          Trophy.create({
            actor: post.tripcode,
            anon: pocket_post.dataValues.tripcode,
            trophy: groups[1],
            post_id: groups[2],
            anon_id: post_id
          });

        }


      });
    }


  }
};