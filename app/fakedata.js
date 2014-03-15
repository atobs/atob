var faker = require("Faker");

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
    for (var i = 0; i < 100; i++) {
      board_id = board_codes[_.random(0, board_codes.length)];
      var post = Post.create({
        title: faker.Lorem.sentence(),
        text: faker.Lorem.sentences(),
        board_id: board_id
      });

      posts.push(post);
    }
  }
};
