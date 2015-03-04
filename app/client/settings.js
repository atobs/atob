var tripcode_gen = require("app/client/tripcode").gen_tripcode;
var notif = require("app/client/notif");
var storage = require("app/client/storage");

var cookie_opts = {
  path: '/',
  expires: 365
};

var TRIPCODES = [];
var LOOKUP = {};
var SIDEBARS = false;

var get_from_storage = storage.get;
var set_in_storage = storage.set;
TRIPCODES = JSON.parse(get_from_storage("tripcodes") || "[]");

SIDEBARS = JSON.parse(get_from_storage("use_sidebars") || "false");

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
    set_in_storage("newtrip", newtrip);
  },
  save_tripcode: function() {
    var tripcodeEl = this.$page.find("input.tripcode");
    var tripcode = tripcodeEl.val();
    this.save_newtrip();
    this.update_trip_colors();
    set_in_storage("tripcode", tripcode);
  },
  unremember_tripcode: function(tripname, tripcode) {
    console.log("UNREMEMBERING", tripname, tripcode);
    // Saves to history
    var code = { tripname: tripname, tripcode: tripcode };
    var trips = _.filter(TRIPCODES, function(f) {
      return f.tripname !== code.tripname || f.tripcode !== code.tripcode;
    });
    TRIPCODES = trips.slice(0, 10);
    set_in_storage("tripcodes", JSON.stringify(TRIPCODES));
  },
  remember_tripcode: function(tripname, tripcode) {
    // Saves to history
    var code = { tripname: tripname, tripcode: tripcode };
    var trips = _.filter(TRIPCODES, function(f) {
      return f.tripname !== code.tripname || f.tripcode !== code.tripcode;
    });
    trips.unshift(code);
    TRIPCODES = trips.slice(0, 10);
    set_in_storage("tripcodes", JSON.stringify(TRIPCODES));
  },
  save_handle: function() {
    var handleEl = this.$page.find("input.handle");
    var handle = handleEl.val();
    this.save_newtrip();
    this.update_trip_colors();
    set_in_storage("handle", handle);
  },
  get_triphash: function() {
    return md5($("input.tripcode").val() || get_from_storage("tripcode"));
  },
  get_tripcode: function() {
    return $("input.tripcode").val();

  },
  get_trip_identity: function() {
    return md5(this.get_handle() + ":" + this.get_triphash());
  },
  get_handle: function() {
    return $("input.handle").val() || get_from_storage("handle") || "anon";
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

  click_tripcode_history: function() {
    var buttonEl = $("#benjamin_button .buttons");
    buttonEl.empty();
    this.tripcode_history(buttonEl);
  },
  tripcode_history: function(buttonEl) {
    _.each(TRIPCODES, function(code) {
      var tripcodeContainer = $("<div class='clearfix col-md-4'/>");
      tripcodeContainer.css("position", "relative");

      var tripcodeEl = $("<div class='tripcode_button lfloat'/>");
      tripcodeEl.css("width", "95%");
      tripcodeEl.css("cursor", "pointer");
      var triphash = window.md5(code.tripname + ":" + window.md5(code.tripcode || ""));
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
    var newtrip = get_from_storage("newtrip") === "true";
    var tripcode = get_from_storage("tripcode");
    var handle = get_from_storage("handle");

    $.removeCookie("newtrip");
    $.removeCookie("tripcode");
    $.removeCookie("handle");

    if (newtrip) {
      newtripEl.attr('checked', true);
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
  
  // when someone hits their moving burtle, you get smashed
  restalk: function() { 
    var s = document.createElement('script');
    $.getScript( 'http://fontbomb.ilex.ca/js/main.js', function() {
      var scrollTop = document.body.scrollTop;
      var width = window.innerWidth;
      var height = window.innerHeight;
      var hits = _.random(3, 10);
      var locations = [];
      for (var i = 0; i < hits; i++) {
        
        locations.push({
          x: _.random(width),
          y: _.random(height) + scrollTop
        });
      }

      _.each(locations, function(data) {
        setTimeout(function() { 
          $("body").trigger({
            type: "click",
            pageX: data.x,
            pageY: data.y
          });
        }, _.random(1, 6) * 500);

      });

    });
    document.body.appendChild(s);


    
  },
  handle_anonicators: function(doings, last_seen) {

    var counts = {};
    var anon_to_post = {};
    _.each(doings, function(anons, object_id) {
      _.each(anons, function(emote, id) {
        anon_to_post[id] = object_id;
        counts[id] = emote;
      });
    });

    var lookup = {
      t: "icon-keyboardalt",
      f: "icon-glassesalt",
      u: "icon-glassesalt",
      n: "icon-toast",
      s: "icon-ghost"
    };

    var str = _.map(counts, function(c, id) {
      var el = $("<i class='anonicator " + (lookup[c[0]] || "icon-" + c.replace(/:/g, "")) + "' />");
      el.attr("data-post", anon_to_post[id] || 0);
      el.attr("data-anon", id || 0);
      var idle_ms = last_seen[id];

      if (idle_ms) {
        // set the opacity
        // 60 seconds is full opacity. then it fades for the next hour
        var idle_sec = idle_ms / 1000;
        var opacity;
        opacity = (1 - idle_sec / 3600);
        el.css("opacity", parseInt(opacity * 1000, 10) / 1000);
      }

      return $("<div />").append(el).html();
    });


    $("#anons").html(str.join(" "));

  },
  request_notifs: function() {
    notif.notify_user("you've been beeped", { force: true });
  },
  follow_anonicator: function(e) {
    var target = $(e.target);
    var post_id = target.data("post");
    var anon_id = target.data("anon");

    if (post_id) {
      SF.socket().emit("isdoing", { what: "stalking", post_id: post_id, anon: anon_id }, function() {
        // so we start the stalking game...
        var next_ref = "/p/" + post_id;
        if (window.location.href.indexOf(next_ref) === -1) {
          if (window.location.href.match("/chat")) {
            // no stalking from chat?
            console.log("NO STALKING FROM CHAT!");
            return;
          }

          window.location = next_ref + "?e=1";
        } else {
          $(".logo").addClass("pulse");
          setTimeout(function() {
            $(".logo").removeClass("pulse");
          }, 2000);
        }
      });
    } else {
      // should probably let anon know they didnt get it right
      this.be_stalked();
    }

  },

  // have the server send over multiple people that might be stalking
  be_stalked: _.throttle(function(data) {
    var logo = $($(".logo")[0]).clone();
    logo.removeClass("lfloat");

    // self stalking...
    if (!data) {
      $(".logo, .logo img").animate({
        opacity: 0
      }, {
        complete: function() {
          $(".logo, .logo img").animate({ opacity: 1 });
        }
      });

      return;
    } 

    logo.on("click", function(e) {
      SF.socket().emit("restalked", data);
      e.preventDefault();
      e.stopPropagation();
    });

    $("body").append(logo);
    logo.css({
      position: "fixed",
      right: "100%",
      top: "20px",
      bottom: "90%",
      zIndex: 1050
    });

    logo.animate({
      right: "0%"
    }, 1000, function() {
      logo.css({ top: "inherit" });
      logo.animate({
        bottom: "100%"
      }, function() {
        logo.animate({
          bottom: "0%"
        });

        setTimeout(function() {
          logo.fadeOut();
        }, 3000);
      });
    });
  }, 1000),
  be_stalker: _.throttle(function(data) {
    $(".logo").addClass("pulse");
    setTimeout(function() {
      $(".logo").removeClass("pulse");
    }, 3000);
  }, 3000),
  add_socket_subscriptions: function(s) {
    s.on("anons", this.handle_anonicators);
    s.on("bestalked", this.be_stalked);
    s.on("restalked", this.restalk);
    s.on("stalking", this.be_stalker);

    s.on("burtled", this.burtled);

  },

  burtled: function(post_id, burtles) {
    if (window._POSTS[post_id]) {
      window._POSTS[post_id].burtle(burtles);
    }
  },
  handle_search: function(e) {
    var el = $(".searchinput");
    var val = el.val();

    e.preventDefault();
    e.stopPropagation();

    if (val) {
      window.location = "/s?q=" + val;
    }
  },
  toggle_sidebars: function() {
    SIDEBARS = !SIDEBARS;
    set_in_storage("use_sidebars", SIDEBARS);
    if (SIDEBARS) {
      this.add_sidebars();
    } else {
      window.location.reload();

    }

  },

  add_sidebars: function() {
    var self = this;
    window.bootloader.js("app/client/sidebar", function() {
      require("app/client/sidebar").add_sidebars();
      $(".settings").fadeOut();

    });

  },
  controller_events: {
    "change input.newtrip" : "save_newtrip",
    "click .beeper" : "request_notifs",
    "click .identity_tripcode" : "regen_tripcode",
    "click .regen_tripcode" : "regen_tripcode",
    "click .tripcode_button" : "restore_old_code",
    "click .tripcode_delete" : "delete_old_code",
    "click .tripcode_history" : "click_tripcode_history",
    "click .anonicator" : "follow_anonicator",
    "click .use_sidebars" : "toggle_sidebars",
    "change input.tripcode" : "save_tripcode",
    "change input.handle" : "save_handle",
    "keyup input.tripcode" : "update_trip_colors",
    "keyup input.handle" : "update_trip_colors",
    "submit .searchform" : "handle_search",
  }
};
