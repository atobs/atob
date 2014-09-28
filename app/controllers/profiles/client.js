"use strict";

var tripcoder = require("app/client/tripcode");
var settings = require("app/client/settings");
module.exports = {
  events: {
    "click .identity_tripcode" : "regen_tripcode",

  },
  init: function() {
    this.init_tripcodes();
    this.init_profile_codes();
    this.loop_jaw();
  },
  timeago: function() {
    var timeago = this.$el.find(".timeago");
    timeago.timeago();
  },
  init_profile_codes: function() {
    this.$el.find(".profile_code").each(function() {
      // init some profile codes
      tripcoder.gen_tripcode($(this));
    });
  },
  loop_jaw: function() {
    var open = true;
    var jaw = $(".cover_photo_bottom");
    var interval = 800;
    function loop_jaw() {
      setTimeout(function() {
        if (open) {
          open = !open;
          jaw.animate({ marginTop: "-100px" }, interval, "swing", loop_jaw); 
        } else {
          open = !open;
          jaw.animate({ marginTop: "0px" }, interval, "swing", loop_jaw); 
        }
      }, interval * 2);
    }

    loop_jaw();
  }
};
_.extend(module.exports, settings);
