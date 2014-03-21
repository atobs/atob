var sequelize = require_app("models/model");

var Post = require_app("models/post");
var Ban = sequelize.instance.define('Ban', {
  ip: sequelize.STRING,
  from: sequelize.STRING,
  post_id: sequelize.INTEGER,
  reason_id: sequelize.INTEGER,
  tripcode: sequelize.STRING,
  hours: sequelize.INTEGER,
  board: sequelize.STRING
});

Ban.hasOne(Post);
Ban.hasOne(Post, { as: 'Reason', foreignKey: 'reason_id'});

module.exports = Ban;
