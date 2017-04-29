var board_names = require_app("server/board_names");

module.exports = {
  contains(b) {
    return _.contains(module.exports.boards, b);
  },
  boards: [ board_names.CLERETICS, board_names.HERETICS, board_names.APOSTLES ]
}
