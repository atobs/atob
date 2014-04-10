var sequelize = require_app("models/model");


var ArchivedPost = sequelize.archive.define('ArchivedPost', {
  title: sequelize.STRING,
  text: sequelize.TEXT,
  thread_id: sequelize.INTEGER,
  tripcode: sequelize.STRING,
  author: sequelize.STRING,
  replies: sequelize.INTEGER,
  downs: sequelize.INTEGER,
  ups: sequelize.INTEGER,
  bumped_at: sequelize.DATE
});

ArchivedPost.hasOne(ArchivedPost, { as: 'Thread', foreignKey: 'thread_id', through: null });
ArchivedPost.hasMany(ArchivedPost, { as: 'Children', foreignKey: 'parent_id', through: null });

module.exports = ArchivedPost;

