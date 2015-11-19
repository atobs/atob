"use strict";

var USE_UPBOATS = true;

// aspect ratio is width / height. so... 16/9 = what it sounds like.
// to untranslate, multiply by it or divide by it
function size_tag_for_viewport(img_tag, aspect) {
  var width = "300px";
  var height = "auto";


  var viewportWidth = $(window).width();
  var viewportHeight = $(window).height();

  if (viewportWidth > 600) {
    if (aspect) {
      width = 300;
      height = width / aspect;
    }
  }

  if (viewportWidth > 900) {
    if (aspect) {
      width = 500;
      height = width / aspect;
    }

  }

  if (viewportWidth > 1200) {
    if (aspect) {
      width = 600;
      height = width / aspect;
    }
  }

  img_tag.css("max-width", viewportWidth * 2.0 / 3.0 + "px");
  img_tag.css("max-height", viewportHeight / 2 + "px");

  if (aspect) {
    img_tag.attr("width", width + "px");
    img_tag.attr("height", height + "px");
  } else {
    img_tag.css({
      width: width + "px",
      height: "auto"
    });
  }

}

function is_youtube_url(url) {
  var matches = url.match(/http:\/\/(?:www\.)?youtube.*watch\?v=([a-zA-Z0-9\-_]+)/);
  var httpsmatches = url.match(/https:\/\/(?:www\.)?youtube.*watch\?v=([a-zA-Z0-9\-_]+)/);
  var nosmatches = url.match(/(?:www\.)?youtube.*watch\?v=([a-zA-Z0-9\-_]+)/);
  return (matches && matches[1]) || (httpsmatches && httpsmatches[1]) || (nosmatches && nosmatches[1]);
}

function is_vimeo_url(url) {
  var matches = url.match(/vimeo.com\/([0-9]+)/);

  return matches && matches[1];
}

function is_webm_url(url) {
  var matches = url.match(/webm$/);
  return matches;
}

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

function add_upboat(el, href, text) {
  if (!USE_UPBOATS) {
    return;
  }

  var upboat = $("<a class='icon-arrow-up upboat indicator'/>");

  el.append(upboat);
  upboat.attr('data-href', href.toString());
  upboat.attr('data-text', text.toString());
}

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

  add_upboat(img_tag, href, text);

  var tag = outer.html();
  return tag;
};

function is_image_link(href) {
  var webm = is_webm_url(href);
  var vimeo = is_vimeo_url(href);
  var youtube = is_youtube_url(href);
  var gfy = is_gfycat_url(href);
  var gif = null;


  return webm || vimeo || youtube || gfy || gif;

}

renderer.link = function(href, title, text) {
  var outer = $("<div/>");
  var link = $("<a />");
  var orig_text = text;
  var escaped_href = $("<div />").html(href).text();

  link.addClass("linklink");

  var unsafe;

  var image_link = is_image_link(href);

  if (image_link) {
    outer.append($("<a>[link]</a>").attr("href", href).attr("target", "_blank"));
    link = $("<span />");
    link.addClass("imglink");
    link.removeClass("linklink");
  } else {
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
  }

  link.html(text);
  link.attr("href", escaped_href);
  link.attr("target", "_blank");

  outer.prepend(link);

  add_upboat(link, href, orig_text);

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

// Takes HTML
function add_board_links($el) {
  var escaped = " " + $el.html() + " ";
  if (escaped) {
    var replaced = escaped.replace(/\s\/r\/(\w+)/g, function(x, post_id) {
      var reddit_str = " <a target='_blank' href='http://www.reddit.com/r/NAME'><i class='icon-reddit'></i>/NAME</a>";
      return reddit_str.replace(/NAME/g, post_id.toLowerCase());
    });

    replaced = replaced.replace(/\s\/4(?:ch)?\/(\w+)/g, function(x, post_id) {
      var chan_str = " <a target='_blank' href='http://4chan.org/NAME'><i class='icon-circlefour'></i>/NAME</a>";
      return chan_str.replace(/NAME/g, post_id.toLowerCase());
    });

    replaced = replaced.replace(/\s\/8(?:ch)?\/(\w+)/g, function(x, post_id) {
      var chan_str = " <a target='_blank' href='http://8ch.net/NAME'><i class='icon-circleeight'></i>/NAME</a>";
      return chan_str.replace(/NAME/g, post_id.toLowerCase());
    });

    replaced = replaced.replace(/\s\/e(?:ch)?\/(\w+)/g, function(x, post_id) {
      var chan_str = " <a target='_blank' href='http://euphoria.io/room/NAME'><i class='icon-emojigrin'></i>/NAME</a>";
      return chan_str.replace(/NAME/g, post_id.toLowerCase());
    });

    replaced = replaced.replace(/\s\/(\w+)/g, function(x, post_id) {
      var reply_str = " <span href='/b/NAME' class='boardlink' target='_blank'><i class='icon-atob'></i>/NAME</span>";
      return reply_str.replace(/NAME/g, post_id.toLowerCase());
    });

    $el.html(replaced);
  }
}

// Takes HTML
function add_replies($el) {
  var escaped = $el.html();
  if (escaped) {
    var reply_str = "<div class='tripcode oplink desaturate' data-parent-id='NAME' data-tripcode='' ></div>";
    var replaced = escaped.replace(/&gt;&gt;#?([\d]+)\s*\*/ig, function(x, post_id) {
      return reply_str.replace(/NAME/g, post_id.toLowerCase());
    });

    reply_str = "<a href='/p/NAME' class='replylink' data-parent-id='NAME'>&gt;&gt;NAME</a>";
    replaced = replaced.replace(/&gt;&gt;#?([\d]+)/g, function(x, post_id) {
      return reply_str.replace(/NAME/g, post_id.toLowerCase());
    });

    reply_str = " <a href='/p/ID' class='postlink'>#ID</a> ";

    replaced = replaced.replace(/[^&;]#([\d]+)/g, function(x, post_id) {
      return reply_str.replace(/ID/g, post_id.toLowerCase());
    });

    // replace thread IDs at beginning of line, too
    replaced = replaced.replace(/^#([\d]+)/g, function(x, post_id) {
      return reply_str.replace(/ID/g, post_id.toLowerCase());
    });


    $el.html(replaced);
  }
}

function translate_markdown($el, escaped) {
  escaped = marked(escaped, { renderer: renderer, breaks: true, sanitize: true});

  // need to add icons here before data-text is added to the element
  var icon_str = "<i class='icon icon-NAME' title=':NAME:'> </i>";
  var icon_re = new RegExp(icon_str.replace(/NAME/g, '(.*)'), "g");
  var replaced = escaped.replace(/:([\w-]+):/g, function(x, icon) {
    return icon_str.replace(/NAME/g, icon.toLowerCase());
  });
  $el.html(replaced);
  $el.addClass("marked");

  // tidy up the links that have icony things in them
  var links = $el.find("a");
  links.each(function() {
    var href = $(this).attr("href");
    if (href) {
      href = href.replace(icon_re, ":$1:");
      $(this).attr("href", href);
    }

  });

  var brs = $el.find("br");
  brs.each(function() {
    var $br = $(this);

    var textEl = $br[0].previousSibling || $br[0].prev;
    if (textEl) {
      if (textEl.data) {
        var match = textEl.data.toString().match(/^(&gt;|>)((?!(&gt;|>)))/);
        if (match) {
          var text = textEl.data;
          text = "<span class='blockquote'>" + text + "</span>";
          $(textEl).remove();

          $br.before($(text));
        } else {
          // regex for ">>reply >" (in case someone tries to blockquote with a reply in front)
          match = textEl.data.toString().match(/^((&gt;&gt;|>>)\d+\s*)+(&gt;|>)((?!(&gt;|>)))/);
          if (match) {
            var text = textEl.data;
            text = "<span class='blockquote'>" + text + "</span>";
            $(textEl).remove();

            $br.before($(text));
          }
        }
      }
    }
  });



}

// Hmmm...
function add_markdown($el) {
  var escaped = $el.text().trim();

  translate_markdown($el, escaped);

  if (typeof window !== "undefined") {
    var storage = require("app/client/storage");
    var filtercontent = storage.get("filtercontent");
    if (filtercontent === "true") {
      require("app/client/profanity")($el);
    }
  }

  $el.attr("data-text", escaped);


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
  shorten_text($el);


}

function make_webm_url(img_link) {

  var img_tag = $("<video muted=1 autoplay=1 />");
  img_tag.append(
    $("<source />").attr("src", img_link)
  );

  size_tag_for_viewport(img_tag);
  return img_tag;
}

function make_youtube_tag(img_link) {
  var match = is_youtube_url(img_link);
  var proto = document.location.protocol;
  var youtube_url = "www.youtube.com/embed/";
  if (proto === "https:") {
    youtube_url = "https://" + youtube_url;
  } else {
    youtube_url = "http://" + youtube_url;
  }
  var img_tag = $("<iframe frameborder=0 />").attr("src", youtube_url + match + "?autoplay=1&html5=1");
  size_tag_for_viewport(img_tag, 16.0 / 9.0);
  return img_tag;

}

function make_vimeo_url(img_link) {
  var match = is_vimeo_url(img_link);
  var proto = document.location.protocol;
  var youtube_url = "player.vimeo.com/video/";
  if (proto === "https:") {
    youtube_url = "https://" + youtube_url;
  } else {
    youtube_url = "http://" + youtube_url;
  }
  var img_tag = $("<iframe frameborder=0 />").attr("src", youtube_url + match + "?autoplay=1");
  size_tag_for_viewport(img_tag, 16.0 / 9.0);
  return img_tag;

}

function is_gfycat_url(img_link) {
  var matches = img_link.match(/:\/\/(?:www\.)?gfycat.com\/([a-zA-Z0-9\-_]+)/);
  return (matches && matches[1]);

}

function make_gfycat_url(img_link) {
  var match = is_gfycat_url(img_link);
  console.log("MATCH IS", match);

  if (!match) {
    return;
  }

  var img_tag = $("<video muted=1 autoplay=1 />");
  img_tag.append(
    $("<source />").attr("src", "//zippy.gfycat.com/" + match + ".webm")
  );
  img_tag.append(
    $("<source />").attr("src", "//fat.gfycat.com/" + match + ".webm")
  );
  img_tag.append(
    $("<source />").attr("src", "//giant.gfycat.com/" + match + ".mp4")
  );

  size_tag_for_viewport(img_tag, 16.0 / 9.0);
  return img_tag;
}

function format_image_link(img_link) {
  var youtube = is_youtube_url(img_link);
  var webm = is_webm_url(img_link);
  var vimeo = is_vimeo_url(img_link);
  var gfycat = is_gfycat_url(img_link);

  if (youtube) {
    return make_youtube_tag(img_link);
  } else if (webm) {
    return make_webm_url(img_link);
  } else if (vimeo) {
    return make_vimeo_url(img_link);
  } else if (gfycat) {
    return make_gfycat_url(img_link);
  } else {

    if (img_link.indexOf("://") == -1) {
      img_link = "http://" + img_link;
    }

    var img_tag = $("<img />") .attr("src", img_link);
    size_tag_for_viewport(img_tag);
    img_tag.css("display", "block");
    return img_tag;
  }

}

module.exports = {
  format_text: format_text,
  add_newlines: add_newlines,
  add_replies: add_replies,
  add_markdown: add_markdown,
  is_image_link: is_image_link,
  format_image_link: format_image_link,
  add_upboats: function(val) {
    USE_UPBOATS = val;
  }
};
