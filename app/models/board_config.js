var sequelize = require_app("models/model");

var BoardConfig = sequelize.instance.define('BoardConfigs', {
  board_id: {
    type: sequelize.STRING,
    primaryKey: true
  },
  config: {
    type: sequelize.TEXT,
    get() {
      var title = JSON.parse(this.getDataValue('config') || "{}");
      return title;
    },
    set(val) { 
      this.setDataValue('config', JSON.stringify(val));
      
    }
  },
  author: sequelize.STRING,
  tripcode: sequelize.STRING
}, {
  instanceMethods: {
    getSetting(key) {
      var config = JSON.parse(this.getDataValue('config') || "{}");
      return config[key];
    },
    setSetting(key, val) {
      var config = JSON.parse(this.getDataValue('config') || "{}");
      config[key] = val;
      this.config = config;
    }
  
  }
});

module.exports = BoardConfig;
