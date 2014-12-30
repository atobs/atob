
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

if (window._cordovaNative && !window._initCordova) {
  console.log("Loading cordova");
  window._initCordova = true;
  var cordova_script = $("<script />");
  var script_el = cordova_script[0];
  
  script_el.src = "/vendor/cordova/cordova.js";
  $("head").append(cordova_script);


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

  try_cordova_backgrounding();

  SF.on("notify", function(title, options, post) {
    try {
      handle_notif(title, options, post);
    } catch(e) {
      console.log("NOTIFY FAILED");
      console.log(e);

    }
  });
}

