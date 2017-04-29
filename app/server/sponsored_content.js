var Post = require_app("models/post");
var board_names = require_app("server/board_names");

module.exports = {
  render(api) {
    api.template.add_stylesheet("sponsored_content");
    var ad;
    return api.page.async(flush => {
      Post.findAll({
        where: { board_id: board_names.ADS, parent_id: null },
      }).success(results => {

        function wrap_in_divs(inner) {
          var outer = $("<div />");
          outer.addClass("atobd mtl");
          if (ad) {
            outer.attr("data-adid", ad.dataValues.id);
            outer.append($("<small><a href='/p/" + ad.dataValues.id + "' title='post in /ads for your own PSA' >sponsored content</a></small>"));
          } else {
            outer.append($("<small><a href='/b/ads' title='post in /ads for your own PSA' >sponsored content</a></small>"));
          }


          outer.append($("<div />").append(inner));

          var outerouter = $("<div />");
          outerouter.append(outer);

          return outerouter.html();

        }

        if (!results || !results.length || !_.random(7)) {
          flush(wrap_in_divs("post in <a href='/b/ads'>/ads</a> to put your own message here"));
        } else {
          // Pick a random ad...
          //
          ad = results[_.random(0, results.length - 1)];

          var postCmp = $C("post", ad.dataValues);
          var text_formatter = require_root("app/client/text");
          postCmp.add_markdown(text_formatter);

          var container = $("<div />");
          container.append(postCmp.$el.find(".title .text").html());
          container.append(postCmp.$el.find(".op.text").html());

          flush(wrap_in_divs(container));

        }

      });


    });
  }
};

