var BoardConfig = require_app("models/board_config");

module.exports = [
 "cleretics",
 "apostles",
 "heretics",
 "faq",
 "bugs",
 "log",
 "mod",
 "cop",
 "ban",
 "test",
 "chat",
 "ads"
];


BoardConfig.findAll().success(function(results) {
  _.each(results, function(config) {
    console.log("CONFIG IS", config);

  });
});
