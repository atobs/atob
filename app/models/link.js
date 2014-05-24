
var sequelize = require_app("models/model");

var Post = require_app("models/post");
var Link = sequelize.instance.define('Links', {
  id: sequelize.INTEGER,
  ip: sequelize.STRING,
  ups: sequelize.INTEGER,
  downs: sequelize.INTEGER,
  author: sequelize.STRING,
  tripcode: sequelize.STRING,
  href: sequelize.STRING,
  title: sequelize.STRING,
  image: sequelize.BOOLEAN,
  created_at: sequelize.DATE,
  updated_at: sequelize.DATE,
  post_id: sequelize.INTEGER,
  board: sequelize.STRING
});

Link.belongsTo(Post, {foreignKey: 'post_id'});
Post.hasMany(Link);

module.exports = Link;
