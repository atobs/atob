var BOARDS = require_app("server/board_names");
var HIDDEN_BOARDS = require_app("server/hidden_boards");
var WORSHIP_BOARDS = require_app("server/worship_boards").boards;

var migrations = {};
migrations["heretics"] = "_heretics";
migrations["cleretics"] =  "_cleretics";
migrations["apostles"] =  "_apostles";


module.exports = {
  run: function() {
    var Post = require_app("models/post");
    _.each(migrations, function(new_board, old_board) {
      Post.findAll({where: {board_id: old_board }}).success(function(results) {
        _.each(results, function(r) {
          r.board_id = new_board;
          r.save();
        });

      });

      if (_.contains(HIDDEN_BOARDS, old_board)) {
        HIDDEN_BOARDS.push(new_board);
      }

      if (_.contains(WORSHIP_BOARDS, old_board)) {
        WORSHIP_BOARDS.push(new_board);
      }

      _.each(BOARDS, function(name, key){
        if (migrations[name]) {
          if (BOARDS[key]) {
            BOARDS[key] = migrations[name];
          }
        }
      });
    });


  }
};
