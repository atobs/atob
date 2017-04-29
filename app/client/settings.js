var tripcode_gen = require("app/client/tripcode").gen_tripcode;
var notif = require("app/client/notif");
var storage = require("app/client/storage");
var anonications = require("app/client/anonications");
var EMOJIES = require("app/client/emojies");
var chat = require("app/client/chat");

require("app/static/vendor/velocity");


var get_anonicator_for = require("app/client/anonications").get_anonicator_for;
var cookie_opts = {
  path: '/',
  expires: 365
};

var TRIPCODES = [];
var FOURCODES = [];
var LOOKUP = {};
var SIDEBARS = false;
var VOYEUR = false;
var MAX_TRIPS = 10;
var MAX_FOURS = 20;
var LENGTH_OF_ENLIGHTENMENT = 30000;

var get_from_storage = storage.get;
var set_in_storage = storage.set;
TRIPCODES = JSON.parse(get_from_storage("tripcodes") || "[]");
FOURCODES = JSON.parse(get_from_storage("fourcodes") || "[]");
SIDEBARS = JSON.parse(get_from_storage("use_sidebars") || "false");
VOYEUR = JSON.parse(get_from_storage("voyeur") || "false");

if (VOYEUR) {
  window.bootloader.require("app/client/voyeur", mod => {
    mod.init();
  });
}


function filter_content() {
  bootloader.require("app/client/profanity", mods => {
    var clean_element = require("app/client/profanity");
    clean_element($("html"));
  });

}

var burtleEl = $("<div class='thirdeye icon-atob' />");

$("body").append(burtleEl);
burtleEl.css({
  position: "fixed",
  zIndex: 1050,
  cursor: "pointer",
  bottom: "10px",
  top: "inherit",
  right: "10px"
});


module.exports = {
  gen_tripcode: tripcode_gen,
  update_trip_colors: _.throttle(function() {
    var tripcodeHash = this.$page.find(".identity_tripcode");
    // this could be cleaner? not sure how to, yet...
    tripcodeHash.data("tripcode", this.get_trip_identity());
    tripcode_gen(tripcodeHash);
  }, 100),
  load_value(name, selector, cb) {
    var el = this.$page.find(selector);
    var val = get_from_storage(name);
    $.removeCookie(name);


    if (cb) {
      cb(el, val);
    }

    return val;

  },

  load_checkbox_value(name, selector, cb) {
    var el = this.$page.find(selector);
    var val = get_from_storage(name) === "true";

    if (val) {
      el.attr("checked", true);
      el.prop("checked", true);
    }

    if (cb) {
      cb(el, val);
    }


    return val;

  },

  save_voyeur(force) {
    var filterEl = this.$page.find("input.voyeur").last();
    _.defer(() => {
      var filter = !!filterEl.prop('checked');
      VOYEUR = filter;
      set_in_storage("voyeur", VOYEUR);

      if (filter || force) {
        window.bootloader.require("app/client/voyeur", mod => {
          mod.init();
        });
      }
    });
  },

  save_threadify() {
    var filterEl = this.$page.find("input.threadify").last();
    _.defer(() => {
      var filter = !!filterEl.prop('checked');

      set_in_storage("threadify", filter);
      window.location.reload();

    });

  },

  save_filter() {

    var filterEl = this.$page.find("input.filtercontent").last();
    _.defer(() => {
      var filter = !!filterEl.prop('checked');

      set_in_storage("filtercontent", filter);

      if (!filter) {
        window.location.reload();
      } else {
        filter_content();
      }
    });

  },
  save_privtrip() {

    var privtripEl = this.$page.find("input.privtrip").last();
    _.defer(() => {
      var privtrip = !!privtripEl.prop('checked');
      set_in_storage("privtrip", privtrip);
      $(".tripbar, .identity_tripcode").toggleClass("desaturate");
    });
  },
  save_notifywhen() {
    var notifyEl = this.$page.find("select.notify_when").last();
    var notify_when = notifyEl.val();
    notif.set_notif_level(notify_when);
    set_in_storage("notify_when", notify_when);

  },
  save_newtrip() {
    var newtripEl = this.$page.find("input.newtrip").last();
    var newtrip = !!newtripEl.prop('checked');
    set_in_storage("newtrip", newtrip);
  },
  save_tripcode() {
    var tripcodeEl = this.$page.find("input.tripcode");
    var tripcode = tripcodeEl.last().val();
    this.save_newtrip();
    this.update_trip_colors();
    set_in_storage("tripcode", tripcode);
  },
  unremember_tripcode(tripname, tripcode) {
    console.log("UNREMEMBERING", tripname, tripcode);
    // Saves to history
    var code = { tripname, tripcode };
    var trips = _.filter(TRIPCODES, f => f.tripname !== code.tripname || f.tripcode !== code.tripcode);
    TRIPCODES = trips.slice(0, MAX_TRIPS);
    set_in_storage("tripcodes", JSON.stringify(TRIPCODES));

    trips = _.filter(FOURCODES, f => f.tripname !== code.tripname || f.tripcode !== code.tripcode);
    FOURCODES = trips.slice(0, MAX_FOURS);
    set_in_storage("fourcodes", JSON.stringify(FOURCODES));
  },
  remember_tripcode_forever(tripname, tripcode) {
    // Saves to history
    if (!tripcode) {
      return;
    }

    var code = { tripname, tripcode };
    var trips = _.filter(FOURCODES, f => f.tripname !== code.tripname || f.tripcode !== code.tripcode);
    trips.unshift(code);
    FOURCODES = trips.slice(0, MAX_FOURS);
    set_in_storage("fourcodes", JSON.stringify(FOURCODES));
  },
  remember_tripcode(tripname, tripcode) {
    // Saves to history
    if (!tripcode) {
      return;
    }

    var code = { tripname, tripcode };
    var trips = _.filter(TRIPCODES, f => f.tripname !== code.tripname || f.tripcode !== code.tripcode);

    var foureva = _.filter(FOURCODES, f => f.tripname === code.tripname && f.tripcode === code.tripcode);

    if (foureva.length) {
      return;
    }

    trips.unshift(code);
    TRIPCODES = trips.slice(0, MAX_TRIPS);
    set_in_storage("tripcodes", JSON.stringify(TRIPCODES));
  },
  save_handle() {
    var handleEl = this.$page.find("input.handle").last();
    var handle = handleEl.val();
    this.save_newtrip();
    this.update_trip_colors();
    set_in_storage("handle", handle);
  },
  get_triphash() {
    return md5($("input.tripcode").last().val() || get_from_storage("tripcode") || "");
  },
  get_tripcode() {
    return $("input.tripcode").last().val();

  },
  get_trip_identity() {
    return md5(this.get_handle() + ":" + this.get_triphash());
  },
  get_trip_identities() {
    var codes = _.clone(TRIPCODES).concat(FOURCODES);

    return _.map(codes, f => md5(f.tripname + ":" + f.tripcode));

  },
  get_handle() {
    return $("input.handle").last().val() || get_from_storage("handle") || "anon";
  },
  regen_tripcode() {
    var tripcodeEl = this.$page.find("input.tripcode");
    _ET.global("tripcode", "regen");

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
  restore_old_code(el) {
    _ET.global("tripcode", "benjamin_button");
    var $el = $(el.target).closest(".tripcode_button");
    var code = LOOKUP[$el.data("tripcode")];
    if (code) {
      var tripcodeEl = this.$page.find("input.tripcode");
      var handleEl = this.$page.find("input.handle");


      handleEl.val(code.tripname);
      tripcodeEl.val(code.tripcode);

      this.save_tripcode();
      this.update_trip_colors();

    }
  },
  delete_old_code(el) {
    console.log("DELETING OLD CODE", el);
    _ET.global("tripcode", "delete");
    var $el = $(el.target).siblings(".tripcode_button");
    var code = LOOKUP[$el.data("tripcode")];
    if (code) {
      var self = this;
      self.unremember_tripcode(code.tripname, code.tripcode);
      var parent = $(el.target).parent();
      var appended;
      var children = parent.children().fadeOut(() => {
        if (!appended) {
          var restoreLink = $("<a href='#'>undo</a>");
          parent.append(restoreLink);

          restoreLink.on("click", () => {
            self.remember_tripcode(code.tripname, code.tripcode);
            restoreLink.remove();
            children.fadeIn();
          });

          appended = true;
        }

      });
    }
  },

  regen_tripcode_history() {
    var buttonEl = $(".benjamin_button .buttons");
    buttonEl.empty();
    this.tripcode_history(buttonEl);

  },

  click_tripcode_history(e) {
    var buttonsContainer = $(".benjamin_button");
    this.regen_tripcode_history();
    var identityContainer = $("#identity_container");

    var el = $(e.target);

    if (buttonsContainer.is(":visible")) {
      identityContainer.slideToggle(() => {
        buttonsContainer.slideToggle();
      });
      el.html("benjamin button");
      _ET.global("tripcode", "open_history");
    } else {
      buttonsContainer.slideToggle(() => {
        identityContainer.slideToggle();
      });
      el.html("back to settings");
      _ET.global("tripcode", "close_history");
    }
  },
  tripcode_history(buttonEl) {
    var self = this;
    function append_tripcode(code, is_four_code) {
      var tripcodeContainer = $("<div class='clearfix col-md-4 col-xs-6 tripcode_wrapper'/>");
      tripcodeContainer.css("position", "relative");

      var tripcodeEl = $("<div class='tripcode_button mtl lfloat'/>");
      tripcodeEl.css("width", "95%");
      tripcodeEl.css("cursor", "pointer");
      var triphash = window.md5(code.tripname + ":" + window.md5(code.tripcode || ""));
      LOOKUP[triphash] = code;
      tripcodeEl.data("tripcode", triphash);


      tripcode_gen(tripcodeEl);
      tripcodeContainer.append(tripcodeEl);
      if (!is_four_code) {
        var deleteEl = $("<a href='#' class='ptm mtl tripcode_delete tripcode_control icon-remove' />");
        tripcodeContainer.append(deleteEl);
        // deleteEl handling is in this class handler for click tripcode_delete
        deleteEl.css("position", "absolute");
        deleteEl.css("right", "9px");

        var pinEl = $("<a href='#' class='ptm mtl tripcode_pin tripcode_control icon-pin' />");
        tripcodeContainer.append(pinEl);
        pinEl.css("position", "absolute");
        pinEl.css("left", "4px");
        pinEl.on("click", () => {
          self.unremember_tripcode(code.tripname, code.tripcode);
          self.remember_tripcode_forever(code.tripname, code.tripcode);
          self.regen_tripcode_history();

          // TODO: move to pinned without regenerating history
        });
      } else {
        var deleteEl = $("<a href='#' class='ptm mtl tripcode_control icon-remove' />");
        deleteEl.on("click", e => {
          e.stopPropagation();
          e.preventDefault();

          self.unremember_tripcode(code.tripname, code.tripcode);
          self.remember_tripcode(code.tripname, code.tripcode);
          self.regen_tripcode_history();

          // TODO: move from pinned without regenerating history
        });
        tripcodeContainer.append(deleteEl);
        deleteEl.css("position", "absolute");
        deleteEl.css("right", "9px");

      }




      buttonEl.append(tripcodeContainer);

    }

    buttonEl.append("<div style='clear: both' class='clearfix'></div>");
    _.each(TRIPCODES, code => {
      append_tripcode(code);
    });
    if (!TRIPCODES.length) {
      buttonEl.append("Sorry - you don't have any saved tripcodes.");
    }

    if (FOURCODES.length) {
      buttonEl.append("<div style='clear: both' class='clearfix'><hr class='clearfix lfloat'/><h2>frozen</h2></div>");

      _.each(FOURCODES, code => {
        append_tripcode(code, true);
      });
    }

  },
  init_tripcodes() {
    this.load_checkbox_value("privtrip", "input.privtrip", (el, val) => {
      if (val) {
        $(".tripbar, .identity_tripcode").addClass("desaturate");
      }
    });
    this.load_checkbox_value("filtercontent", "input.filtercontent", (el, val) => {
      if (val) {
        filter_content();
      }
    });

    this.load_checkbox_value("threadify", "input.threadify", (el, val) => { });
    this.load_checkbox_value("voyeur", "input.voyeur", (el, val) => { });

    var newtrip = this.load_checkbox_value("newtrip", "input.newtrip");

    this.load_value("notify_when", "select.notify_when", (el, val) => {
      if (val) {
        el.val(val);
      } else {
        el.val("page");
      }
    });

    this.load_value("handle", "input.handle", (el, val) => {
      if (val) {
        el.val(val);
      }
    });

    this.load_value("tripcode", "input.tripcode", (el, val) => {
      if (val && !newtrip) {
        el.val(val);
      }
    });

    this.save_tripcode();
    this.update_trip_colors();
  },

  // when someone hits their moving burtle, you get smashed
  restalk() {
    var s = document.createElement('script');
    $.getScript( window.location.protocol + '//fontbomb.ilex.ca/js/main.js', () => {
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

      _.each(locations, data => {
        setTimeout(() => {
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

  handle_meter(meter) {
    var percent = meter.percent;
    var meterEl = $("#apexmeter");
    if (!meterEl.length) {
      meterEl = $("<div id='apexmeter' />");
      meterEl.css({
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "0",
        height: "5px",
        backgroundColor: "#000",
        opacity: 0.6
      });

      $("body").append(meterEl);

    }

    var window_width = $(window).width();
    var bar_percent = ((meter.percent || 0) / meter.max);
    var bar_width =  bar_percent * window_width;
    var bgColor = "#00f";

    if (bar_percent > 0.9) {
      bgColor = "#f00";
    } else if (bar_percent > 0.8) {
      bgColor = "#ff0";
    } else if (bar_percent > 0.7) {
      bgColor = "#0a0";
    }

    meterEl.velocity({
      width: bar_width + "px",
      backgroundColor: bgColor
    });


  },

  burtle_storm() {
    bootloader.require("app/client/burtle_storm", mod => {
      _ET.global("anonicator", "burtle_storm");
      var storms = _.random(1, 3);
      for (var i = 0; i < storms; i++) {
        mod.storm();
      }


    });
  },

  handle_anonicators(doings, last_seen) {

    var counts = {};
    var anon_to_post = {};
    var burtles = {};
    _.each(doings, (anons, object_id) => {
      _.each(anons, (emote, id) => {
        anon_to_post[id] = object_id;
        counts[id] = emote;
        if (emote == "enlightenment") {
          burtles[id] = emote;
        }
      });
    });

    var anon_order = _.keys(counts);
    anon_order = _.sortBy(anon_order, c => last_seen[c]);

    var str = _.map(anon_order, id => {
      var c = counts[id];
      var el = $("<i class='anonicator " + get_anonicator_for(c) + "' />");

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
  request_notifs() {
    notif.notify_user("you've been beeped", { force: true });
  },
  goto_post(post_id, end) {
    var current_url = window.location.pathname;
    var next_url = "/p/" + post_id;
    if (current_url.indexOf(next_url) === -1) {
      // now we move there...
      if (end) {
        next_url += "?e=1";
      }
      window.location = next_url;

    }

  },
  follow_anonicator(e) {
    var target = $(e.target);
    var post_id = target.data("post");
    var anon_id = target.data("anon");
    var self = this;

    function pulse_logo() {
      $(".logo").addClass("pulse");
      setTimeout(() => {
        $(".logo").removeClass("pulse");
      }, 2000);
    }

    if (anonications.check(target, anon_id, module.exports.get_trip_identity())) {
      return;
    }

    _ET.global("anonicator", "poopstalk");

    if (post_id) {
      SF.socket().emit("stalking", {
        what: "stalking",
        post_id,
        anon: anon_id,
        mytrip: module.exports.get_trip_identity()
      }, () => {
        if (post_id === "chat") {
          self.show_chat_popup();  
          pulse_logo();
          return;
        }

        // so we start the stalking game...
        var next_ref = "/p/" + post_id;
        if (window.location.href.indexOf(next_ref) === -1) {
          if (window.location.href.match("/chat")) {
            // no stalking from chat?
            console.log("NO STALKING FROM CHAT!");
            pulse_logo();
            return;
          }

          module.exports.goto_post(post_id, true);

        } else {
          pulse_logo();
        }
      });
    } else {
      // should probably let anon know they didnt get it right
      this.be_stalked();
    }

  },

  // have the server send over multiple people that might be stalking
  be_stalked: _.throttle(data => {
    var logo = $($(".logo")[0]).clone();
    logo.css("zIndex", 2000);
    logo.removeClass("lfloat");
    logo.addClass("burtled");

    // self stalking...
    if (!data) {
      $(".logo, .logo img").velocity({
        opacity: 0
      }, {
        complete() {
          $(".logo, .logo img").velocity({ opacity: 1 });
        }
      });

      return;
    }

    logo.on("click", e => {
      e.preventDefault();
      e.stopPropagation();

      _ET.global("anonicator", "battleship");
      SF.socket().emit("isdoing", {
        what: "battleship",
        mytrip: module.exports.get_trip_identity()
      });

      SF.socket().emit("restalked", data);
    });

    $("body").append(logo);

    if (data.tripcode) {
      var tripcodeHash = logo.find(".identity_tripcode, .burtle_tripcode");
      tripcodeHash.data("tripcode", data.tripcode);
      tripcode_gen(tripcodeHash);
    }
    logo.css({
      position: "fixed",
      right: "100%",
      top: "20px",
      bottom: "90%",
      zIndex: 1050
    });

    logo.velocity({
      right: "0%"
    }, 1000, () => {
      logo.css({ top: "inherit" });
      logo.velocity({
        bottom: "100%"
      }, () => {
        logo.velocity({
          bottom: "0%"
        });

        setTimeout(() => {
          logo.fadeOut();
        }, 3000);
      });
    });
  }, 1000),
  be_stalker: _.throttle(data => {
    $(".logo").addClass("pulse");
    setTimeout(() => {
      $(".logo").removeClass("pulse");
    }, 3000);
  }, 3000),
  add_socket_subscriptions(s) {
    s.on("anons", this.handle_anonicators);
    s.on("burtledance", this.burtle_storm);
    s.on("meter", this.handle_meter);
    s.on("bestalked", this.be_stalked);
    s.on("duckened", this.get_ducked);
    s.on("kited", this.get_kited);
    s.on("snooed", this.get_snooed);
    s.on("restalked", this.restalk);
    s.on("stalking", this.be_stalker);
    s.on("star_post", this.star_post);
    s.on("unstar_post", this.unstar_post);

    s.on("thirdeye", this.see_third_eyes);

    s.on("burtled", this.burtled);
    s.on("goto_post", this.goto_post);
  },

  star_post(post_id) {
    var post = window._POSTS[post_id];
    post && post.star();

  },
  unstar_post(post_id) {
    var post = window._POSTS[post_id];
    post && post.unstar();
  },

  click_adminme() {
    SF.socket().emit("adminme", 
      this.board, this.get_handle(), this.get_triphash(), 
      (isclaimed, isowner, error_msg) => {
        if (error_msg) {
          notif.handle_notif(error_msg, "error"); 
          return;
        }

          
        var board = SF.controller().board;
        if (isowner) {
          $C("board_admin_panel", { board}, cmp => { });
        } else {
          $C("board_claim_panel", { moderated: isclaimed, board }, cmp => { });
        }
      });
  },
  // only get snooed once per 15 seconds
  get_snooed: _.throttle(data => {
     module.exports.burtle_storm();
  }, 15000),

  get_kited(data) {
    var logoEl = $(".logo img").clone();
    $(".container").empty();

    for (var i = 0; i < 200; i++) {
      function jitter_el(el) {
        if (Math.random() < 0.2) {
          el.velocity({
            rotateX: _.random(-100, 100) + "deg",
            rotateY: _.random(-100, 100) + "deg"
          }, {
            duration: 3000,
            complete() { jitter_el(el) }
          });
        } else {
          _.delay(() => { jitter_el(el) }, 3000);
        }

      }

      var el = logoEl.clone();
      el.css({"width" : "100", "height" : "100" });
      $("body").prepend(el);
      jitter_el(el);
    }

  },
  get_unducked() {
    $(".container").fadeIn();
    $("body").velocity({
      backgroundColor: "#fefefe",
      color: "#000"
    });
    $(".ducked").fadeOut();
    $(".duckcode").remove();

  },
  get_ducked(data) {
    $(".container").fadeOut();
    $("body").velocity({
      backgroundColor: "#333",
      color: "#ddd"
    });

    _.delay(() => {
      module.exports.get_unducked();
    }, 3000);

    var ducked = $(".ducked");

    var tripcodeEl = $("<div class='duckcode' />");
    tripcodeEl.data("tripcode", data.tripcode);
    $("body").append(tripcodeEl);
    tripcode_gen(tripcodeEl);

    if (!ducked.length)  {
      $("body").prepend("<h1 class='ducked' style='text-align: center; zoom: 1.5'>get ducked</h1>");
      $("body").scrollTop(0);
    } else {
      ducked.fadeIn();
    }



  },

  burtled(post_id, burtles) {
    if (window._POSTS[post_id]) {
      window._POSTS[post_id].burtle(burtles);
    }
  },
  handle_search(e) {
    var el = $(".searchinput");
    var val = el.val();

    e.preventDefault();
    e.stopPropagation();

    if (val) {
      window.location = "/s?q=" + val;
    }
  },
  toggle_sidebars() {
    SIDEBARS = !SIDEBARS;
    set_in_storage("use_sidebars", SIDEBARS);
    if (SIDEBARS) {
      this.add_sidebars();
    } else {
      window.location.reload();

    }

  },
  set_board(board) {
    this.board = board;
    SF.trigger("set_board");
  },
  add_sidebars() {
    var self = this;
    window.bootloader.require("app/client/sidebar", mod => {
      mod.add_sidebars();
      $(".settings").fadeOut();

    });

  },
  resaturate_tripbar() {
    if (get_from_storage("privtrip") !== "true") {
      this.$el.find(".tripbar").removeClass("desaturate");
      this.$el.find(".identity_tripcode").removeClass("desaturate");
    }
  },
  see_third_eyes(burtles) {
    // find this burtle on the page.. if it doesn't exist, then we create it
    var allBurtles = $(".flying_burtle");

    var w = $(window).width();
    var h = $(window).height();


    var occupied = {};

    _.each(burtles, (b, id) => {
      var burtleEl = $(".burtle_" + id);
      var icon = get_anonicator_for(b.icon) || "icon-atob";
      if (!burtleEl.length) {

        burtleEl = $("<div/>").addClass("burtle_" + id).addClass(icon);
        burtleEl.css({
          position: "fixed",
          left: 0,
          top: 0,
          fontSize: "2em",
          zIndex: "1050"
        });

        burtleEl.on("click", () => {
          _ET.global("anonicator", "thirdeye");
          SF.controller().emit("thirdeyerind", id);
        });

        burtleEl.addClass("flying_burtle");
        burtleEl.appendTo($("body"));
        burtleEl.attr("data-sid", id);
      }

      var ratio_x = b.x / b.w;
      var ratio_y = b.y / b.h;

      var abs_x = parseInt(ratio_x * w, 10);
      var abs_y = parseInt(ratio_y * h, 10);

      var ratio_key = parseInt(ratio_x * 25, 10)  + ":" + parseInt(ratio_y * 25, 10);

      function collision_at(x, y, me, them) {
        var el = $("<div class='hue' />");

        var index_me = _.indexOf(EMOJIES, me.replace("icon-", "")) * 6351212;
        var index_them = _.indexOf(EMOJIES, them.replace("icon-", "")) * 982;
        var index_child = (index_me + index_them) % (EMOJIES.length);

        var emojie_babe = EMOJIES[index_child];

        el.addClass("icon-" + emojie_babe);
        
        el.css({
          position: "fixed",
          left: x + _.random(0, 20),
          top: y + _.random(0, 20),
        });

        _ET.local("anonicator", "sprinkles");

        $("body").append(el);
        setTimeout(() => {
          el.fadeOut();
        }, 1000);
      }

      if (occupied[ratio_key]) {
        collision_at(abs_x, abs_y, occupied[ratio_key], icon);
      }
      occupied[ratio_key] = icon;;


      var proportion = parseInt(b.s, 10);
      burtleEl.velocity("stop").velocity({
        translateX: abs_x,
        translateY: abs_y,
        translateZ: 100,
        opacity: proportion / 100
      }, { 
        duration: 500
      });

    });

    _.each(allBurtles, b => {
      if (!burtles[$(b).data("sid")]) {
        $(b).fadeOut(() => {
          $(b).remove();
        });
      }
    });



  },
  unlock_the_third_eye: _.throttle(e => {
    console.log("UNLOCKING THIRD EYE FOR", LENGTH_OF_ENLIGHTENMENT / 1000, "SECONDS");
    $(e.target).closest(".thirdeye").fadeOut();
    setTimeout(() => {
      $(e.target).closest(".thirdeye").fadeIn();
    }, LENGTH_OF_ENLIGHTENMENT);

    e.stopPropagation();
    e.preventDefault();
    // this is where we start tracking mouse for however long and then we stop
    var controller = SF.controller();
    // normalize coordinates...
    var width = $(window).width();
    var height = $(window).height();

    var talk_to_server = _.throttle((e, proportion) => {
      SF.socket().emit("thirdeye", {
        x: e.clientX,
        y: e.clientY,
        w: width,
        h: height,
        s: proportion
      });

    }, 100);

    var update_width_and_height = _.throttle(() => {
      width = $(window).width();
      height = $(window).height();

    }, 500);

    var start = Date.now();
    $("body").on("mousemove", _.throttle(e => {
      var now = Date.now();
      var left = LENGTH_OF_ENLIGHTENMENT - (now - start);
      var proportion = parseInt(left / LENGTH_OF_ENLIGHTENMENT * 100, 10);
      talk_to_server(e, proportion);
      update_width_and_height();

    }, 50));

    setTimeout(() => {
      $("body").off("mousemove");
    }, LENGTH_OF_ENLIGHTENMENT);
  }, LENGTH_OF_ENLIGHTENMENT),

  click_toggler(e) {
    if ($(e.target).hasClass("icon-bookmark")) {
      _ET.global("favorites", "toggle");
    }

    if ($(e.target).hasClass("icon-squaresettings")) {
      _ET.global("settings", "toggle");
    }
  },

  controller_events: {
    "click .thirdeye" : "unlock_the_third_eye",
    "change input.newtrip" : "save_newtrip",
    "change select.notify_when" : "save_notifywhen",
    "change input.privtrip" : "save_privtrip",
    "change input.filtercontent" : "save_filter",
    "change input.threadify" : "save_threadify",
    "change input.voyeur" : "save_voyeur",
    "click .beeper" : "request_notifs",
    "click .identity_tripcode" : "regen_tripcode",
    "click .regen_tripcode" : "regen_tripcode",
    "click .tripcode_button" : "restore_old_code",
    "click .tripcode_delete" : "delete_old_code",
    "click .tripcode_history" : "click_tripcode_history",
    "click .modme" : "click_adminme",
    "click .anonicator" : "follow_anonicator",
    "click .use_sidebars" : "toggle_sidebars",
    "change input.tripcode" : "save_tripcode",
    "change input.handle" : "save_handle",
    "keyup input.tripcode" : "update_trip_colors",
    "keyup input.handle" : "update_trip_colors",
    "submit .searchform" : "handle_search",
    "click .navbar_helper a[data-toggle]" : "click_toggler"
  }
};

