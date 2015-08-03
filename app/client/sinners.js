
var SINNERS;
module.exports = {
  poopcode: function(el, tripcode) {
    var tripcodeEl = $(el);
    var sinner_data = SINNERS[tripcode];

    tripcodeEl.css("height", "20px");
    tripcodeEl.addClass("poop");

    var iconClass = "icon-poop";
    // for SARAH!
    if (sinner_data.board_id === "cleretics") {
      iconClass = "icon-securityalt-shieldalt";
    }
    // for JOHN!
    if (sinner_data.board_id === "apostles") {
      iconClass = "icon-crackedegg";
    }
    

    tripcodeEl.children().each(function() {
      $(this).html("<i class='icon " + iconClass + "' > </i>");
      var color = $(this).css("backgroundColor");
      $(this).css({
        "color" : color,
        "backgroundColor" : "inherit"
      });
    });

  },
  punish: function(sinners) {
    SINNERS = SINNERS || {};
    _.each(sinners, function(sinner) {
      SINNERS[sinner.tripcode] = sinner;
    });

    SF.trigger("sinners");
  },
  check_reply: function(replyEl, tripcode) {
    SF.do_when(SINNERS, "sinners", function() {
      replyEl.find(".tripcode").each(function() {
        var tripcode = $(this).data("tripcode");
        if (SINNERS[tripcode]) {
          module.exports.poopcode(this, tripcode);
        }
      });

    });

    bootloader.require("app/client/john", function(john) {
      john(replyEl);
    });
  },
};
