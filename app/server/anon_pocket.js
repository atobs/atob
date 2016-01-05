var Trophy = require_app("models/trophy");
var Post = require_app("models/post");
var HIDDEN_BOARDS = require_app("server/hidden_boards");

var POCKET_RE = /:hand-right:\s*(:[\w-]*:\s*)+(?:\(.?\(\s*)?&gt;&gt;\s*(\d*)/;
module.exports = {
  find_and_create_items: function(post) {
    if (post.dataValues) {
      post = post.dataValues;
    }

    var post_id = post.post_id || post.id;
    if (post_id) {
      Trophy.findAll({where: { anon_id: post_id }}).success(function (results) {
        _.each(results, function(r) { r.destroy(); }); 
      });
    }

    if (!post.text) {
      return;
    }

    var text = post.text;
    var groups = text.match(POCKET_RE);
    var trophies = [];
    while (groups && groups[2]) {
      var trophy = groups[1].trim();
      var parent_id = groups[2];

      if (!parent_id || !trophy) {
        break;
      }

      trophies.push([trophy, parent_id]);
      text = text.replace(groups[1], ""); 
      groups = text.match(POCKET_RE);
    }

    var index = 0;
    function make_trophy() {
      if (index >= trophies.length) { return; }

      var trophy = trophies[trophies.length - 1 - index];
      console.log("Adding trophy", trophy, "in post", parent_id);

      Post.find({ where: { id: trophy[1] }, order: "id ASC"}).success(function(pocket_post) {
        if (pocket_post) {
          // we found a post, therefore we can make this action!
          Trophy.create({
            actor: post.tripcode,
            updated_at: pocket_post.created_at + (index * 1000),
            created_at: pocket_post.created_at + (index * 1000),
            anon: pocket_post.dataValues.tripcode,
            trophy: trophy[0],
            post_id: parent_id,
            anon_id: post_id
          });
        }
      });



      index++;
      setTimeout(make_trophy, 1500);
    }

    make_trophy();
  }
};
