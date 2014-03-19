var sequelize = require_app("models/model");

var User = require_app("models/user");
var Board = require_app("models/board");

var Post = sequelize.instance.define('Post', {
  title: sequelize.STRING,
  text: sequelize.TEXT,
  thread_id: sequelize.INTEGER,
  tripcode: sequelize.STRING,
  author: sequelize.STRING,
  replies: sequelize.INTEGER,
  downs: sequelize.INTEGER,
  ups: sequelize.INTEGER
});

Post.hasOne(Post, { as: 'Thread', foreignKey: 'thread_id', through: null });
Post.hasMany(Post, { as: 'Children', foreignKey: 'parent_id', through: null });
Board.hasMany(Post);

module.exports = Post;
