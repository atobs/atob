var sequelize = require_app("models/model");

var User = require_app("models/user");
var Board = require_app("models/board");

var Post = sequelize.instance.define('Post', {
  title: sequelize.STRING,
  text: sequelize.TEXT
});
Board.hasMany(Post);

module.exports = Post;
