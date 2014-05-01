"use strict";

require("app/static/vendor/Autolinker");


var renderer = new marked.Renderer();
renderer.blockquote = function(quote) {
  var quote_text = "";
  if (quote) {
    try {
      quote_text = $(quote).text();
    } catch(e) {
      quote_text = quote;
    }
  }

  return "&gt;" + quote_text.trim();
};

renderer.paragraph = function(quote) {
  return quote + "<br />";
};

renderer.heading = function(head) {
  return "#" + head;
};

renderer.image = function(href, title, text) {
  var url_tag = $("<span>");
  var img_tag = $("<a target='_blank'>[link]</a>");

  url_tag.html(text);
  url_tag.attr("href", href);
  url_tag.css("cursor", "pointer");

  img_tag.attr("href", href);
  img_tag.css("margin-left", "5px");
  url_tag.addClass("imglink");

  var outer = $("<div />");
  outer.append(url_tag);
  outer.append(img_tag);

  var tag = outer.html();
  return tag;
};

renderer.link = function(href, title, text) {
  var outer = $("<div/>");
  var link = $("<a />");

  link.addClass("linklink");

  var unsafe;
  if (href.match("^\s*javascript:")) {
    unsafe = true;
    link.addClass("unsafelink");
    outer.addClass("unsafelink");
    var textEl = $("<span />");
    textEl.addClass("unsafelink");
    textEl.html("[<b>UNSAFE</b>] " + text + " ");
    outer.append(textEl);
    text = "[click here at your own risk!]";
  } else {
    text += " [link]";
  }

  link.html(text);
  link.attr("href", href);
  link.attr("target", "_blank");

  outer.append(link);

  return outer.html();
};

// Takes HTML
function add_newlines($el) {
  var escaped = $el.html();
  if (escaped) {
    escaped = escaped.trim();
    var replaced = escaped.replace(/\n\s*\n*/g, 
      "<br class='mtl mbl' /> <span class='placeholder' >&nbsp;</span>");
    $el.html(replaced);
  }
}

// Takes escaped text
function add_icons($el, replace_urls) {
  var escaped = $el.html();

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
function add_board_links($el) {
  var escaped = " " + $el.html() + " ";
  if (escaped) {
    var reply_str = " <a href='/b/NAME' class='boardlink' target='_blank'>/NAME</a>";
    var replaced = escaped.replace(/\s\/(\w+)/g, function(x, post_id) {
      return reply_str.replace(/NAME/g, post_id.toLowerCase());
    });

    $el.html(replaced);
  }
}

// Takes HTML
function add_replies($el) {
  var escaped = $el.html();
  if (escaped) {
    var reply_str = "<span href='#' class='replylink' data-parent-id='NAME' >&gt;&gt;NAME</span>";
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

// Hmmm...
function add_markdown($el) {
  var escaped = $el.text().trim();
  escaped = marked(escaped, { renderer: renderer});

  $el.html(escaped);
  $el.addClass("marked");
}

function shorten_text($el) {
  var escaped = $el.text();
  if (escaped.length > 800) {
    $el.addClass("hideContent");
    $el.addClass("truncable");

    var show_link = $("<a class='show_more' href='#'><small>click to see full comment</small></a>");
    $el.after(show_link);
  }
}

function format_text($el) {
  add_markdown($el);
  add_replies($el);
  add_board_links($el);
  add_icons($el, true /* replace URLS */);
  shorten_text($el);
}

module.exports = {
  format_text: format_text,
  add_icons: add_icons,
  add_newlines: add_newlines,
  add_replies: add_replies,
  add_markdown: add_markdown
};
