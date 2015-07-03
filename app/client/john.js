
var SWEAR_REs = [
  /\bjohn\b/ig
];

var Luni;
function sweep_text(el) {
  var context = el.nodeValue;
  _.each(SWEAR_REs, function(swr) {
    if (swr.test(context)) {
      var replaced =  Luni.tools.creepify.encode("JOHN");
      context = context.replace(swr, replaced);
    }
  });

  el.nodeValue = context;

}

function clean_element(element) {
  element = $(element)[0];
  if (!element || !element.childNodes) {
    return;
  }
  recurse(element);
}

function recurse(element)
{
  if (element.childNodes.length > 0)
    for (var i = 0; i < element.childNodes.length; i++)
      recurse(element.childNodes[i]);

  if (element.nodeType == Node.TEXT_NODE && /\S/.test(element.nodeValue)) {
    sweep_text(element);
  }
}

module.exports = function(el) {
  bootloader.require("app/static/vendor/lunicode", function(Lunicode) {
    Luni = new Lunicode();

    el = $(el)[0];
    recurse(el);

  });
}
