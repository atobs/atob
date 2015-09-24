
var actions = {
  ducky: "kited",
  reddit: "snooing",
  comedy: "ducking"

};

module.exports = {
  check: function(targetEl, anon_id, tripcode) {
    var ret = false;
    _.each(actions, function(action, index) {
      if (targetEl.hasClass("icon-" + index)) {
        SF.socket().emit("stalking", {
          what: action,
          anon: anon_id,
          mytrip: tripcode
        });

        ret = true;
      }

    });

    return ret;
  }
};
