require("app/static/vendor/Autolinker");
require("app/static/vendor/marked");

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
  var url_tag = $("<a />");
  url_tag.attr("href", href);

  var img_tag = $("<img />");
  img_tag.attr("src", href);
  img_tag.attr('title', title);
  img_tag.css("height", "50px");
  
  url_tag.append(img_tag);

  var outer = $("<div />");
  outer.append(url_tag);

  var tag = outer.html();
  return tag;

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

// Hmmm...
function add_markdown($el) {
  var escaped = $el.text().trim();
  escaped = marked(escaped, { renderer: renderer});

  $el.html(escaped);
  $el.addClass("marked");
}

function shorten_text($el) {
  var escaped = $el.html();
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
