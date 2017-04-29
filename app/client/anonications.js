
var ICON_LOOKUP = {
  e: "icon-atob",
  t: "icon-keyboardalt",
  f: "icon-glassesalt",
  u: "icon-glassesalt",
  d: "icon-ducky",
  b: "icon-comedy",
  n: "icon-toast",
  s: "icon-ghost"
};

function get_anonicator_for(c) {
  if (!c) {
    return "";
  }

  var ret = ICON_LOOKUP[c[0]];
  if (!ret) {
    c = c.replace(/:/g, "");
    if (c.indexOf("_") !== -1) { // glyphicons
      ret = "glyphicon glyphicon-" + c.replace(/_/, "");
    } else { // default icon set
      ret = "icon-" + c;
    }
  }
  return ret;
}

var actions = {
  ducky: "kited",
  reddit: "snooing",
  comedy: "ducking"

};

module.exports = {
  check(targetEl, anon_id, tripcode) {
    var ret = false;
    _.each(actions, (action, index) => {
      if (targetEl.hasClass("icon-" + index)) {
        SF.socket().emit("stalking", {
          what: action,
          anon: anon_id,
          mytrip: tripcode
        });

        _ET.global("anonicator", action);

        ret = true;
      }

    });

    return ret;
  },
  get_anonicator_for
};
