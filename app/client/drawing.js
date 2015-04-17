var iframe;
var insertedFrame = false;
var clearFrameTimer;
var showing = false;

function toggler(e) {
  if (e.keyCode === 192 && e.ctrlKey) {
    module.exports.toggle();

  }
}

toggler = _.throttle(toggler, 100);

$("html").keyup(toggler);
$(window).on("message", function(msg) {
  if (msg.originalEvent.data == "tilde") {
    module.exports.hide();
  }
});


function maybehideframe() {
  clearTimeout(clearFrameTimer);
  clearFrameTimer = setTimeout(function() {
    if (showing) {
      return;
    }

    iframe.remove();
    iframe = null;
    insertedFrame = false;

  }, 30000);


}

function checkInstall() {
  if (!iframe) {
    module.exports.install();
  }

  if (!insertedFrame) {
    $("html").append(iframe);
    insertedFrame = true;
  }

}
module.exports = {
  install: function() {
    if (!iframe) {

      iframe = $("<iframe id='gtgkthx' />");

      // Need to figure out if we are on HTTPS or on HTTP...
      // TODO: remove these dependencies on external URLS...
      if (document.location.protocol == "https:") {
        iframe.attr("src", "https://atob.xyz:444");
      } else {
        iframe.attr("src", "http://gtg.kthxb.ai");
      }

      iframe.css({
        width: "100%",
        height: "100%",
        position: "fixed",
        top: 0,
        left: 0,
        display: "none",
        zIndex: 9999
      });

      var toggleEl = $("<div class='drawing_board'> </div>");
      var ICONS = [ "icon-edit", "icon-poop", "icon-acorn", "icon-koala", "icon-onion", "icon-heart", "icon-grave", "icon-circlepencil" ];
      var icon_str = ICONS[_.random(0, ICONS.length-1)];

      toggleEl.addClass(icon_str);
      toggleEl.css({
        position: "fixed",
        cursor: "pointer",
        bottom: "10px",
        left: "18px",
        display: "block",
        zIndex: 10000,
        width: "20px",
        height: "20px"
      });

      toggleEl.on("click", module.exports.toggle);
      $("body").append(toggleEl);


    }

  },
  show: function() {
    showing = true;
    checkInstall();
    iframe.fadeIn();
    iframe.focus();

  },
  hide: function() {
    showing = false;
    checkInstall();
    iframe.fadeOut();
    $(window).focus();

    maybehideframe();
  },
  toggle: function() {
    checkInstall();
    showing = !showing;
    iframe.fadeToggle();
    maybehideframe();

  }
};

module.exports.install();
