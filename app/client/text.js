require("app/static/vendor/Autolinker");

// Takes HTML
function add_newlines($el) {
  var escaped = $el.html();
  if (escaped) {
    escaped = escaped.replace(/^\s*(.*)\s*$/, "$1");
    var replaced = escaped.replace(/\n\s*\n+/g, 
      "<br class='mtl mbl' /> <span class='placeholder' >&nbsp;</span>");
    $el.html(replaced);
  }
}

// Takes escaped text
function add_icons($el, replace_urls) {
  var escaped = $el.text();

  if (escaped) {
    var icon_str = "<i class='icon icon-NAME' title=':NAME:' />";
    var replaced = escaped.replace(/:([\w-]+):/g, function(x, icon) {
      return icon_str.replace(/NAME/g, icon.toLowerCase());
    });

    if (replace_urls) {
      replaced = window.Autolinker.link(replaced);
    }

    $el.html(replaced);
  }
}

// Takes HTML
function add_replies($el) {
  var escaped = $el.html();
  if (escaped) {
    var reply_str = "<a href='#' class='replylink' data-parent-id='NAME' >&gt;&gt;NAME</a>";
    var replaced = escaped.replace(/&gt;&gt;#?([\d]+)/g, function(x, post_id) {
      return reply_str.replace(/NAME/g, post_id.toLowerCase());
    });

    reply_str = "<a href='/p/ID' class='postlink'>#ID</a>";
    replaced = replaced.replace(/#([\d]+)/g, function(x, post_id) {
      return reply_str.replace(/ID/g, post_id.toLowerCase());
    });

    $el.html(replaced);
  }
}

function shorten_text($el) {
  var escaped = $el.html();
  if (escaped.length > 800) {
    $el.addClass("hideContent");
    $el.addClass("truncable");

    var show_link = $("<a class='show_more' href='#'><small>full comment</small></a>");
    $el.after(show_link);
  }
}

function format_text($el) {
  add_icons($el, true /* replace URLS */);
  add_replies($el);
  add_newlines($el);
  shorten_text($el);
}

module.exports = {
  format_text: format_text,
  add_icons: add_icons,
  add_newlines: add_newlines,
  add_replies: add_replies
};
