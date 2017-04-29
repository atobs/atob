"use strict";

var component_name = "TEMPLATE";

describe(component_name, () => {
    it("builds on the client", done => {
      $C(component_name, { name: "first_button"}, cmp => {
        assert.notEqual(cmp, null);
        assert.notEqual(cmp.$el, null);
        done();
      });
    });
    it("renders on the client", done => {
      $C(component_name, { name: "first_button"}, cmp => {
        assert.notEqual(cmp, null);
        assert.notEqual(cmp.$el, null);
        done();
      });
    });
});
