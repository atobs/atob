var faker = require("Faker");
var crypto = require("crypto");

module.exports = {
  generate: function() { 

    var Board = require_app("models/board");
    var Post = require_app("models/post");

    var boards = [];
    var board_ids = {};
    var board_id;
    for (var i = 0; i < 10; i++) {
      board_id = parseInt(Math.random() * 26, 10); 
      var board_code = String.fromCharCode(97 + board_id);

      if (board_ids[board_code]) {
        i--;
        continue;
      }

      board_ids[board_code] = 1;
      var board = Board.create({
        name: board_code,
        title: faker.Company.catchPhrase()
      });
      boards.push(board);
    }

    var posts = [];
    var board_codes = _.keys(board_ids);
    var density = 0.90;
    for (var i = 0; i < 100; i++) {
      board_id = board_codes[_.random(0, board_codes.length)];

      var parent_index = null;
      if (Math.random() < density) {
        parent_index = _.random(0, posts.length);
      }

      var parent = posts[parent_index];
      if (parent && parent_index != null) {
        parent.success(function(p) {
          var post_data = {
            title: faker.Lorem.sentence(),
            text: faker.Lorem.sentences(),
            board_id: board_id,
          };

          post_data.thread_id = p.thread_id;
          post_data.parent_id = p.id;
          post_data.board_id = p.board_id;

          var hash = crypto.Hash("md5");
          hash.update("" + faker.Lorem.words());
          post_data.tripcode = hash.digest('hex');
          var post = Post.create(post_data);
          posts.push(post);
        });
      } else {
        var post_data = {
          title: faker.Lorem.sentence(),
          text: faker.Lorem.sentences(),
          board_id: board_id,
        };

        var post = Post.create(post_data);
        posts.push(post);
      }

    }
  }
};
