
var storage = require("app/client/storage");

var sidebars = [];
var contentHandler;

var sidebarOffset = "-102%";
function make_sidebar(toggle_selector, content_selector, side) {
  var events = _.clone(Backbone.Events);

  var sidebar_el = $("<div />");
  var oldArea = $(content_selector);
  oldArea.find("input").each(function() {
    $(this).attr("value", $(this).val());
  });

  sidebar_el.append(oldArea.html());

  sidebars.push(sidebar_el);
  sidebar_el.addClass("sidr " + side);

  $("body").append(sidebar_el);

  var logobarEl = $("#logobar");
  var logobarLeft = 0;
  if (logobarEl.length) {
    logobarLeft = parseInt(logobarEl.css("left").replace(/px/, ""), 10);
  }

  var nav_selector = ".navbar_helper .logo";

  $(toggle_selector).on("click", function(e) {
    e.stopPropagation();
    e.preventDefault();

    var was_opened = sidebar_el.data("opened");

    var side_name = side;
    var other_side_name = side === "right" ? "left" : "right";
    var options = {};
    if (!was_opened) {
      _.each(sidebars, function(sidebar) {
        sidebar.hide();
        sidebar.data("opened", false);
      });

      bootloader.require("app/static/vendor/jquery.transit.min", function() { 
        if (side === "right") {
          sidebar_el.css({
            right: sidebarOffset
          });

          sidebar_el.show();
          sidebar_el.animate({
            right: 0,
            left: "auto"
          });
        } else {
          sidebar_el.css({
            left: sidebarOffset
          });

          sidebar_el.show();
          sidebar_el.animate({
            left: 0,
            right: "auto"
          });
        }



        if (!contentHandler) {
          contentHandler = true;

          $(".content").one("click", function(e) {
            e.preventDefault();
            e.stopPropagation();

            sidebar_el.data("opened", true);

            $(toggle_selector).click();
            contentHandler = false;
          });

        }

        $(".navbar_helper .logo img").animate({
          rotate: "220deg"
        }).animate({
          rotate: "360deg",
          easing: "in-out"
        });



      });

      events.trigger("opened");


    } else {
      $(".navbar_helper .logo img").animate({
        rotate: "180deg"
      }).animate({
        rotate: "360deg",
        easing: "in-out"
      });

      var anim_options = {};
      anim_options[side_name] = sidebarOffset;
      sidebar_el.animate(anim_options, function() { });
      options[side_name] = "0px";
      options[other_side_name] = "auto";
      $(nav_selector).animate(options);

      $("#logobar").css(side_name, logobarLeft + "px");
      options.position = "auto";
      events.trigger("closed");


    }

    sidebar_el.data("opened", !was_opened);
    $("#logobar").hide().show(0);
  });

  return events;


}


function add_sidebars() {
  var use_sidebars = storage.get("use_sidebars") === "true";
  if (!window._cordovaNative && !use_sidebars) {
    return;
  }


  var sidebarEl = $("input.use_sidebars");
  sidebarEl.attr("checked", true);
  sidebarEl.prop("checked", true);

  var unclickable = true;
  $(".navbar .navlinks a").click(function(e) {
    if (unclickable) { 
      e.preventDefault();
      e.stopPropagation();
      return true;
    }

  });

  bootloader.css("jquery.sidr.light", function() {
    if (window._addedSidebars) {
      return;
    }
    window._addedSidebars = true;


    make_sidebar("#logobar .logo", ".navbar .navlinks", "left");
    // end home link


    // add benjamin button directly into the sidebar
    var sidebar_events = make_sidebar("a.settingslink", ".navbar .settings", "right");
    sidebar_events.on("opened", function() {
      var tripcodes_button = $("a.tripcode_history");
      tripcodes_button.hide();
      var tripcodeContainer = $(".tripcode_holder");

      if (!tripcodeContainer.length) {
        tripcodeContainer = $("<div class='lfloat clearfix tripcode_holder' style='width: 100%' />");
        tripcodeContainer.appendTo(tripcodes_button.parent());
      } else {
        tripcodeContainer.empty();
      }

      require("app/client/settings").tripcode_history(tripcodeContainer);

    });

    // make the up top links animate a bit...
    $(".navbar .navlinks a").animate({
      "margin-left": "-2000px"
    }).fadeOut(function() {
      unclickable = false; 
    });


    // append a /home link to the navlinks, too
    var link_sidebar = $(".sidr .boardlink")[0];
    var home_link = $(link_sidebar).clone();
    home_link.find("a")
      .attr("href", "/")
      .html("HOME");
    $(link_sidebar).parent().prepend(home_link);

    $(".sidr h2.identity").remove();
    $(".sidr .boardlink").css("width", "100%");

  });
}


module.exports = {
  add_sidebars: add_sidebars
};

