
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
    } catch(e) {
      console.log("COULDNT BACKGROUND APP: " + e);
      setTimeout(try_cordova_backgrounding, 3000);
    }
  }, 0);
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



}

