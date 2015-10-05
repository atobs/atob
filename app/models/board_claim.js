var sequelize = require_app("models/model");

var BoardClaim = sequelize.instance.define('BoardClaims', {
  board_id: sequelize.STRING,
  accepted: sequelize.BOOLEAN,
  author: sequelize.STRING,
  tripcode: sequelize.STRING
});

module.exports = BoardClaim;
