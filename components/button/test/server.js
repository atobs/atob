"use strict";

var test_helper = require("superfluous").test_helper;
test_helper.init();

var assert = require("assert");
var component_name = "button";

describe(component_name, () => {
  test_helper.setup_server(() => {
    var component = require_core("server/component");

    it("builds on the server", test_helper.wrap(done => {
      component.build(component_name, { name: "first_button"}, cmp => {
        assert.notEqual(cmp, null);
        assert.notEqual(cmp.$el, null);
        done();
      });
    }));

    it("renders on the server", test_helper.wrap(done => {
      component.build(component_name, {name: "first_button"}, cmp => {
        assert.notEqual(cmp.$el.html(), null);

        done();
      });
    }));
  });
});
