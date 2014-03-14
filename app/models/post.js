var sequelize = require_app("models/model");

var User = require_app("models/user");
var Post = sequelize.instance.define('Post', {
  title: sequelize.STRING,
  text: sequelize.TEXT
});

Post.hasOne(User, { as: "author" });

module.exports = Post;
