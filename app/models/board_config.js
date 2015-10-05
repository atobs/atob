var sequelize = require_app("models/model");

var BoardConfig = sequelize.instance.define('BoardConfigs', {
  board_id: sequelize.STRING,
  config: sequelize.TEXT,
  author: sequelize.STRING,
  tripcode: sequelize.STRING
});

module.exports = BoardConfig;
