function summarize_post(post, archive) {
  if (typeof $ === "undefined") {
    $ = require("cheerio");
  }
  archive = archive || "p";

  var div = $("<div class='post' />");
  var first_a = $("<a />");
  var second_a = $("<a />");
  var url = "/" + archive + "/" + post.id;
  first_a.attr("href", url);
  second_a.attr("href", url);
  var small = $("<small />");
  first_a.text("#" + post.id);
  var b = $("<b class='text' />").html(post.title);
  var span = $("<span class='text' />").html(post.text);
  second_a.append(b);
  second_a.append(span);

  small.append(first_a);
  if (archive === "p") {
    small.append(" /" + post.board_id + " ");
  } else {
    small.append(" ");
  }

  small.append(second_a);
  div.append(small);

  var outer = $("<div />");
  outer.append(div);

  var escaped = outer.text();
  if (escaped.length > 300) {
    small.addClass("hideContent");
    small.addClass("truncable");
  }

  return outer.html();
}

module.exports = summarize_post;
