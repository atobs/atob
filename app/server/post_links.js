"use strict";

var $ = require("cheerio");
var Link = require_app("models/link");
var marked = require_app("static/vendor/marked");
var UPBOAT_TIMEOUT = 60 * 1000;
var Link = require_app("models/link");
var bridge = require_core("server/bridge");
var HIDDEN_BOARDS = require_app("server/hidden_boards");

var text_formatter = require_app("client/text");

function find_and_create_links(post) {
  if (post.dataValues) {
    post = post.dataValues;
  }

  if (_.contains(HIDDEN_BOARDS, post.board_id)) {
    return;
  }

  var div = $("<div />").html(post.text || "");
  if (div.text()) {
    CUR_POST = post;
    marked(div.text(), { renderer });
  }
}

var CUR_POST;
var renderer = new marked.Renderer();

function add_link(href, title, string, is_image) {
  var this_post = CUR_POST;

  if (!is_image) {
    is_image = text_formatter.is_image_link(href);
  }


  Link.findAll( { where: {
    href
    }
  })
  .success(links => {
    links = _.filter(links, link => link.post_id === this_post.id);

    href = href.trim();
    if (href.indexOf("javascript:") === 0) {
      return;
    }

    if (!links || !links.length) {
      Link.create({
        href,
        title: string,
        ups: 0,
        downs: 0,
        author: this_post.author,
        tripcode: this_post.tripcode,
        post_id: this_post.id || this_post.post_id,
        board: this_post.board_id,
        image: !!is_image
      });

    }

  });
}

function add_image_link(href, title, string) {
  add_link(href, title, string, true);
}

renderer.link = add_link;
renderer.image = add_image_link;

module.exports = {
  find_and_create_links,
  erase_links(post, cb) {
    Link.destroy({ post_id: post.id }).success(() => {
      if (cb) {
        cb();
      }
    });
  },
  upvote_link(link, cb) {
    if (!link.post_id || !link.href || !link.title) {
      if (cb) { 
        cb();
      }
      return;
    }

    Link.find({ where: {
      post_id: link.post_id,
      href: link.href,
      title: link.title
    }}).success(result => {
      if (Date.now() - result.updated_at < UPBOAT_TIMEOUT) {
        if (cb) { cb(); }
        return;
      }

      if (result) {
        result.ups += 1;
        result.save();
      }

      if (cb) {
        cb();
      }

    });
  },
  freshen_client(post_id, children, cb) {

    var UPBOAT_TIMEOUT = 60 * 1000;
    var post_ids = _.map(children, c => c.id);
    post_ids.push(post_id);

    Link.findAll({ where: { post_id: post_ids }}).success(links => {

      var fresh_links = _.filter(links, l => (Date.now() - l.updated_at) < UPBOAT_TIMEOUT);

      fresh_links = _.map(fresh_links, l => ({
        href: l.href,
        post_id: l.post_id,
        updated_at: l.updated_at,
        title: l.title,
        remaining: UPBOAT_TIMEOUT - (Date.now() - l.updated_at)
      }));

      if (fresh_links.length) {
        bridge.call("app/client/post_utils", "freshen_links", post_id, fresh_links);
      }

      if (cb) {
        cb();
      }

    });

  }
};
