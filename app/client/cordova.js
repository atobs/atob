// TODO
// look at thread conversation recreation
// some sort of per thread 'last left off' marker

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

    } catch(e) {
      setTimeout(try_cordova_backgrounding, 3000);
    }
  }, 0);
}


function add_background_notifications() {
  try_cordova_backgrounding();
}

var sidebars = [];
function make_sidebar(toggle_selector, content_selector, side) {
  var sidebar_el = $("<div />");
  sidebar_el.append($(content_selector).html());
  sidebars.push(sidebar_el);
  sidebar_el.addClass("sidr");
  $("body").append(sidebar_el);

  $(toggle_selector).on("click", function(e) {
    e.stopPropagation();
    e.preventDefault();

    var was_opened = sidebar_el.data("opened");

    _.each(sidebars, function(sidebar) {
      sidebar.hide();
      sidebar.data("opened", false);
    });

    var side_name = side;
    var other_side_name = side === "right" ? "left" : "right";
    var options = {};
    if (!was_opened) {

      var sidebar_options = {};
      if (side === "right") {
        sidebar_el.css({
          right: 0,
          left: "auto"
        });
      } else {
        sidebar_el.css({
          left: 0,
          right: "auto"
        });
      }

      sidebar_el.fadeIn();
      options[side_name] = "250px";
      options[other_side_name] = "auto";
      options.position = "relative";
      $("#page_content").css(options);
      
    } else {
      sidebar_el.fadeOut(function() { });
      options[side_name] = "0px";
      options[other_side_name] = "auto";
      $("#page_content").css(options);
      options.position = "auto";

    }

    sidebar_el.data("opened", !was_opened);
    $("#logobar").hide().show(0);
  });


}


var added = false;
function add_sidebars() {
  bootloader.css("jquery.sidr.light", function() {
    if (added) {
      return;
    }
    added = true;


    make_sidebar(".logo", ".navbar .navlinks", "left");
    // end home link


    make_sidebar("a.settingslink", ".navbar .settings", "right");

    // make the up top links animate a bit...
    $(".navbar .navlinks a").animate({
      "margin-left": "-200px"
    }).fadeOut();

    
    console.log("MAKING HOME LINK");
    // append a /home link to the navlinks, too
    var link_sidebar = $(".sidr .boardlink")[0];
    var home_link = $(link_sidebar).clone();
    home_link.find("a")
      .attr("href", "/")
      .html("HOME");
    $(link_sidebar).parent().prepend(home_link);

  });
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

    if (href && href.indexOf("#") !== 0 && target === "_system") {
      e.preventDefault();
      e.stopPropagation();

      window.open(href, target);
    }

    return true;
  });


}


var notif_count = 0;
function handle_notif(title, options, post) {
  if (window.plugin && window.plugin.notification) {
    setTimeout(function() {
      window.plugin.notification.local.add({
          id:      1,
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


if (window._cordovaNative && !window._initCordova) {
  
  insert_cordova();

  add_sidebars();
  add_notifications();
  add_in_app_browser();
  add_pull_to_refresh();
  add_background_notifications();
}

