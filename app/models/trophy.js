var sequelize = require_app("models/model");

var Trophy = sequelize.instance.define('Trophy', {
  id: { type: sequelize.INTEGER, primaryKey: true},
  actor: sequelize.STRING,
  anon: sequelize.STRING,
  trophy: sequelize.STRING,
  anon_id: { 
    type: sequelize.INTEGER,
    defaultValue: 1
  },
  post_id: { 
    type: sequelize.INTEGER,
    defaultValue: 1
  }
}, {
  tableName: "Trophies"
});

module.exports = Trophy;
