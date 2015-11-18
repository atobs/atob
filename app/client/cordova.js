// TODO
// look at thread conversation recreation
// some sort of per thread 'last left off' marker
//
//
// icon
// pinned posts?
// starred boards



function try_cordova_backgrounding() {
  setTimeout(function() {
    // now we setup background notifications, too
    try {
      console.log("backgrounding app");
      window.plugin.backgroundMode.setDefaults({
          text: 'listening for new truths',
          title: 'atob',
          ticker: 'atob is with you'
        });
      window.plugin.backgroundMode.enable();
      window.plugin.backgroundMode.onactivate = function() {
        notif_count = 0;
      };
      window.plugin.backgroundMode.ondeactivate = function() {
        notif_count = 0;
      };

      window.plugin.notification.local.onclick = function(id, state, json) {
        if (json) {
          window.location.replace("/p/" + json);
        }

      };

    } catch(e) {
      setTimeout(try_cordova_backgrounding, 3000);
    }
  }, 0);
}


function add_background_notifications() {
  try_cordova_backgrounding();
}

function add_pull_to_refresh() {
  // install pull to refresh
  bootloader.css(["RubberBand"], function() {
    bootloader.require("app/static/vendor/RubberBand", function() {
      var RB = new RubberBand(function(e) {
        window.location.reload();
      });
    });
  });
}

function add_in_app_browser() {
  $(document).on("click", "a", function(e) {
    var el = $(e.target).closest("a");
    var href = el.attr("href");
    var target = el.attr("target");

    if (href && href.indexOf("#") !== 0 && target === "_blank") {
      e.preventDefault();
      e.stopPropagation();

      window.open(href, target);
    }

    return true;
  });


}


var notif_count = 0;

function handle_notif(title, options, post) {
  if (window.plugin && window.plugin.notification && document.hidden) {
    setTimeout(function() {
      window.plugin.notification.local.add({
          id:      1,
          json:      post.id,
          title:   title,
          message: options.body,
          autoCancel: true
      });
    });
  }

  if (window.plugin && window.plugin.backgroundMode) {
    if (window.plugin.backgroundMode.isActive()) {
      console.log("BG MODE IS ACTIVE");
      notif_count += 1;
      window.plugin.backgroundMode.configure({
        text: notif_count + " new truths"
      });
    } else {
      notif_count = 0;
      window.plugin.backgroundMode.configure({
        text: "listening for new truths"
      });
    }
  }

}

function add_notifications() {
  SF.on("notify", function(title, options, post) {
    try {
      handle_notif(title, options, post);
    } catch(e) {
      console.log("NOTIFY FAILED");
      console.log(e);

    }
  });
}

function insert_cordova() {
  console.log("Loading cordova");
  window._initCordova = true;
  var cordova_script = $("<script />");
  var script_el = cordova_script[0];


  script_el.src = "/vendor/cordova/cordova.js";
  $("head").append(cordova_script);
}

function setup_back_button() {
  document.addEventListener("backbutton", function() {
    window.history.back();
  });
}


if (window._cordovaNative && !window._initCordova) {

  insert_cordova();

  $(".use_sidebars").closest(".checkbox").hide();

  add_notifications();
  add_in_app_browser();
//  add_pull_to_refresh();
  add_background_notifications();
  setup_back_button();
}

