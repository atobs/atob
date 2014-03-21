var sequelize = require_app("models/model");

var Post = require_app("models/post");
var IP = sequelize.instance.define('IP', {
  ip: sequelize.STRING,
  browser: sequelize.STRING,
});

IP.belongsTo(Post);

module.exports = IP;

