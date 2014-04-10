"use strict";
var settings = require("app/client/settings");

module.exports = {
  events: {

  },
  init: function() {
    this.init_tripcodes();
  }
};

_.extend(module.exports, settings);
