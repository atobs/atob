var tripcode_gen = require("app/client/tripcode").gen_tripcode;

var cookie_opts = {
  path: '/',
  expires: 365
};

var TRIPCODES = [];
var LOOKUP = {};

var bootloader = window.bootloader;
TRIPCODES = JSON.parse($.cookie("tripcodes") || "[]");

module.exports = {
  gen_tripcode: tripcode_gen,
  update_trip_colors: _.throttle(function() {
    var tripcodeHash = this.$el.find(".identity_tripcode");
    // this could be cleaner? not sure how to, yet...
    tripcodeHash.data("tripcode", this.get_trip_identity());
    tripcode_gen(tripcodeHash);
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
  unremember_tripcode: function(tripname, tripcode) {
    console.log("UNREMEMBERING", tripname, tripcode);
    // Saves to history
    var code = { tripname: tripname, tripcode: tripcode };
    var trips = _.filter(TRIPCODES, function(f) {
      return f.tripname !== code.tripname || f.tripcode !== code.tripcode;
    });
    TRIPCODES = trips.slice(0, 10);
    console.log(TRIPCODES);
    $.cookie("tripcodes", JSON.stringify(TRIPCODES), cookie_opts);
  },
  remember_tripcode: function(tripname, tripcode) {
    // Saves to history
    var code = { tripname: tripname, tripcode: tripcode };
    var trips = _.filter(TRIPCODES, function(f) {
      return f.tripname !== code.tripname || f.tripcode !== code.tripcode;
    });
    trips.unshift(code);
    TRIPCODES = trips.slice(0, 10);
    $.cookie("tripcodes", JSON.stringify(TRIPCODES), cookie_opts);
  },
  save_handle: function() {
    var handleEl = this.$page.find("input.handle");
    var handle = handleEl.val();
    this.save_newtrip();
    this.update_trip_colors();
    $.cookie("handle", handle, cookie_opts);
  },
  get_triphash: function() {
    return md5($("input.tripcode").val());
  },
  get_tripcode: function() {
    return $("input.tripcode").val();

  },
  get_trip_identity: function() {
    return md5(this.get_handle() + ":" + this.get_triphash());
  },
  get_handle: function() {
    return $("input.handle").val();
  },
  regen_tripcode: function() {
    var tripcodeEl = this.$page.find("input.tripcode");

    // try out choosing 5 words:
    var tripcode = md5(Math.random() + "");
    var words = $(".text").text().split(" ");
    var keywords = [];
    if (words.length > 10) {
      try {
        for (var i = 0; i < 5; i++) {
          keywords.push(
            words[parseInt(Math.random() * words.length, 10)]
              .trim(" ").replace(/\W/g, '')
          );
        }

        tripcode = keywords.join(" ").replace(/  /, ' ');
      } catch(e) {
      }
    }

    tripcodeEl.val(tripcode);

    this.save_tripcode();
    this.update_trip_colors();
  },
  restore_old_code: function(el) {
    var $el = $(el.target).closest(".tripcode_button");
    var code = LOOKUP[$el.data("tripcode")];
    if (code) {
      var tripcodeEl = this.$page.find("input.tripcode");
      var handleEl = this.$page.find("input.handle");


      handleEl.val(code.tripname);
      tripcodeEl.val(code.tripcode);

      this.save_tripcode();
      this.update_trip_colors();

      $("#benjamin_button").modal("hide");

    }
  },
  delete_old_code: function(el) {
    console.log("DELETING OLD CODE", el);
    var $el = $(el.target).siblings(".tripcode_button");
    var code = LOOKUP[$el.data("tripcode")];
    if (code) {
      var self = this;
      self.unremember_tripcode(code.tripname, code.tripcode);
      var parent = $(el.target).parent();
      var appended;
      var children = parent.children().fadeOut(function() {
        if (!appended) {
          var restoreLink = $("<a href='#'>reremember</a>");
          parent.append(restoreLink);

          restoreLink.on("click", function() {
            self.remember_tripcode(code.tripname, code.tripcode);
            restoreLink.remove();
            children.fadeIn();
          });

          appended = true;
        }

      });
    }
  },
  tripcode_history: function() {
    var buttonEl = $("#benjamin_button .buttons");
    buttonEl.empty();
    _.each(TRIPCODES, function(code) {
      var tripcodeContainer = $("<div class='clearfix col-md-4'/>");
      tripcodeContainer.css("position", "relative");

      var tripcodeEl = $("<div class='tripcode_button lfloat'/>");
      tripcodeEl.css("width", "95%");
      tripcodeEl.css("cursor", "pointer");
      var triphash = window.md5(code.tripname + ":" + window.md5(code.tripcode));
      LOOKUP[triphash] = code;
      tripcodeEl.data("tripcode", triphash);


      tripcode_gen(tripcodeEl);
      tripcodeContainer.append(tripcodeEl);
      var deleteEl = $("<a href='#' class='tripcode_delete icon-remove' />");
      tripcodeContainer.append(deleteEl);
      deleteEl.css("position", "absolute");
      deleteEl.css("right", "0px");


      buttonEl.append(tripcodeContainer);

    });

    if (!TRIPCODES.length) {
      buttonEl.append("Sorry - you don't have any saved tripcodes.");
    }
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
  },
  handle_anonicators: function(doings) {

    var counts = {};
    _.each(doings, function(anons) {
      _.each(anons, function(emote, id) {
        counts[id] = emote;
      });
    });

    var lookup = {
      t: "icon-keyboardalt",
      f: "icon-glassesalt",
      u: "icon-glassesalt"
    };

    var str = _.map(_.values(counts), function(c) {
      return "<i class='" + (lookup[c[0]] || "icon-" + c.replace(/:/g, "")) + "' />";
    });


    $("#anons").html(str.join(" "));

  }
};
