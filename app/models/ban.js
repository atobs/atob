var sequelize = require_app("models/model");

var Post = require_app("models/post");
var Ban = sequelize.instance.define('Ban', {
  ip: sequelize.STRING,
  browser: sequelize.STRING,
  from: sequelize.STRING,
  tripcode: sequelize.STRING,
  duration: sequelize.INTEGER
});

Ban.hasOne(Post);
Ban.hasOne(Post, { as: 'Reason', foreignKey: 'reason_id'});

module.exports = Ban;
