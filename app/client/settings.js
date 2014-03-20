var tripcode_gen = require("app/client/tripcode");

var cookie_opts = {
  path: '/'
};

module.exports = {
  gen_tripcode: tripcode_gen,
  update_trip_colors: _.throttle(function() {
    if (SF.controller().gen_tripcode) {
      var tripcodeHash = this.$el.find(".identity_tripcode");
      tripcodeHash.empty();
      tripcodeHash.data("tripcode", this.get_trip_identity());
      SF.controller().gen_tripcode(tripcodeHash);
    }
  }, 100),
  save_newtrip: function() {
    var newtripEl = this.$page.find("input.newtrip");
    var newtrip = !!newtripEl.prop('checked');
    $.cookie("newtrip", newtrip, cookie_opts);
  },
  save_tripcode: function() {
    var tripcodeEl = this.$page.find("input.tripcode");
    var tripcode = tripcodeEl.val();
    this.save_newtrip();
    this.update_trip_colors();
    $.cookie("tripcode", tripcode, cookie_opts);
  },
  save_handle: function() {
    var handleEl = this.$page.find("input.handle");
    var handle = handleEl.val();
    this.save_newtrip();
    this.update_trip_colors();
    $.cookie("handle", handle, cookie_opts);
  },
  get_tripcode: function() {
    return md5($("input.tripcode").val());
  },
  get_trip_identity: function() {
    return md5(this.get_handle() + ":" + this.get_tripcode());
  },
  get_handle: function() {
    return $("input.handle").val();
  },
  init_tripcodes: function() {
    var tripcodeEl = this.$page.find("input.tripcode");
    var handleEl = this.$page.find("input.handle");
    var newtripEl = this.$page.find("input.newtrip");
    var newtrip = $.cookie("newtrip") === "true";
    var tripcode = $.cookie("tripcode");
    var handle = $.cookie("handle");

    $.removeCookie("newtrip");
    $.removeCookie("tripcode");
    $.removeCookie("handle");

    if (newtrip) {
      newtripEl.prop('checked', true);
    }

    if (tripcode && !newtrip) {
      tripcodeEl.val(tripcode);
    }
    if (handle) {
      handleEl.val(handle);
    }

    this.save_tripcode();
    this.update_trip_colors();
  }
};
