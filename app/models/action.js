var sequelize = require_app("models/model");

var Action = sequelize.instance.define('Action', {
  id: { type: sequelize.INTEGER, primaryKey: true},
  object: sequelize.STRING,
  actor: sequelize.STRING,
  action: sequelize.STRING,
  count: { 
    type: sequelize.INTEGER,
    defaultValue: 1
  }
});

module.exports = Action;
