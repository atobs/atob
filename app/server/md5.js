"use strict";

var crypto = require("crypto");
var gen_md5 = h => {
  var hash = crypto.Hash("md5");
  hash.update("" + h);
  return hash.digest("hex");
};

module.exports = gen_md5;
