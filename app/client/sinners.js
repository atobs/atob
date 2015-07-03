
var SINNERS;
module.exports = {
  poopcode: function(el) {
    var tripcodeEl = $(el);
    tripcodeEl.css("height", "20px");
    tripcodeEl.addClass("poop");
    tripcodeEl.children().each(function() {
      $(this).html("<i class='icon icon-poop' > </i>");
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
      SINNERS[sinner.tripcode] = true;
    });

    SF.trigger("sinners");
  },
  check_reply: function(replyEl, tripcode) {
    SF.do_when(SINNERS, "sinners", function() {
      replyEl.find(".tripcode").each(function() {
        var tripcode = $(this).data("tripcode");
        if (SINNERS[tripcode]) {
          module.exports.poopcode(this);
        }
      });

    });

    bootloader.require("app/client/john", function(john) {
      john(replyEl);
    });
  },
};
