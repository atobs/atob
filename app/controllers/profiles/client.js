"use strict";

var tripcoder = require("app/client/tripcode");
var settings = require("app/client/settings");
module.exports = {
  events: {
  },
  init: function() {
    this.init_tripcodes();
    this.init_profile_codes();
    this.loop_jaw();
    $(".loading").fadeOut(function() {
      $(".loading h2").text("mutating doppelnon...");
      $(".navbar").hide();
      $(".profile_container").removeClass("hidden");
    
    });
  },
  timeago: function() {
    var timeago = this.$el.find(".timeago");
    timeago.timeago();
  },
  set_code: function(code) {
    function do_work() {
      SF.controller().emit("get_emotions", code, function(e) {
        console.log("EMOTIONS", e);
        $(".loading").fadeIn();
        _.delay(function() { 
          $(".container").slideUp(function() {
            $(".loading h2").text("deleting old doppelnons...");
            $(".loading").fadeOut();
            // now adjust the profile based on emotions...
            var s = e.subjectivity;
            var p = e.polarity;

            var roundedness = 100 - (e.subjectivity * 100);

            var sum = Math.abs(s) + Math.abs(p);
            var delta_p = p - s;
            var delta_s = s - p;

            $(".profile_photo").css("width", parseInt(p * 100, 10) + "px");
            $(".profile_photo").css("left", parseInt((1-(delta_s)) * 100, 10) + "px");
            $(".profile_photo_right").css("right", parseInt((1-(delta_s)) * 100, 10) + "px");
            $(".profile_photo_right").css("left", "inherit");

          
            $(".cover_photo").css("overflow", "hidden");
            $(".cover_photo_bottom").css("overflow", "visible");
            $(".cover_photo").css("border-radius", parseInt(
              sum * 50, 10) + "px");
            $(".cover_photo_bottom").css("max-height", parseInt((delta_s) * 200, 10) + "px");

            if (p < 0) {
              $(".profile_photo").css("width", "100px");
              $(".profile_photo").css("height", parseInt(1-p * 100, 10) + "px");

            }

            if (s < 0) {
              $(".cover_photo_bottom").css("border-radius", parseInt(roundedness, 10) + "px");
              $(".cover_photo_bottom").css("overflow", "hidden");
            }

            $(".profile_photo").css("border-radius", parseInt(roundedness, 10) + "px");

            $(".container").fadeIn(1000, function() { 
              $(".loading").slideUp(); 
            });

          
          
          });
        }, 3000);
      });
    }

    this.code = code;
    var socket = SF.socket();
    if (!socket) {
      SF.once("bridge/socket", function() { do_work(); });
    } else {
      do_work();
    }
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
  },
  is_noob: function() {
    this.$el.find(".profile_photo").addClass("noob");
    this.$el.find(".cover_photo_bottom").addClass("desaturate");
  }
};
_.extend(module.exports, settings);
_.extend(module.exports.events, settings.controller_events);
