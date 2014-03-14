var sequelize = require_app("models/model");

var Board = sequelize.instance.define('Board', {
  title: sequelize.STRING,
  name: { 
    type: sequelize.STRING,
    primaryKey: true
  },
  description: sequelize.TEXT
});

module.exports = Board;
