
var SWEAR_REs = {
  "JOHN" : /\bjohn\b/ig,
  "SARAH" : /\bsarah\b/ig
};

var Luni;
function sweep_text(el) {
  var context = el.nodeValue;

  // test for john...
  _.each(SWEAR_REs, (swr, rep) => {
    if (swr.test(context)) {
      var replaced =  Luni.tools.creepify.encode(rep);
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

module.exports = el => {
  bootloader.require("app/static/vendor/lunicode", Lunicode => {
    Luni = new Lunicode();

    el = $(el)[0];
    recurse(el);

  });
}
