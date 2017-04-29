var sequelize = require_app("models/model");

var Post = require_app("models/post");
var IP = sequelize.instance.define('IP', {
  ip: sequelize.STRING,
  browser: sequelize.STRING,
});

IP.belongsTo(Post);

var gen_md5 = require_app("server/md5");
IP.toHash = ip => gen_md5("atob:" + ip);

module.exports = IP;

