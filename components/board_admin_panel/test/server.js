"use strict"

var test_helper = require("superfluous").test_helper;
test_helper.init();

var assert = require("assert");
var component = require_core("server/component");

describe('TEMPLATE', () => {
  test_helper.setup_server(() => {
    component.build('TEMPLATE', {}, cmp => {
      describe('#initialize()', () => {
        it('should initialize the component', () => {
          assert.notEqual(cmp, null);
        });
      });
    });

    component.build('TEMPLATE', {}, cmp => {
      describe('#client()', () => {
        it('should initialize the component on the client', () => {
          assert.notEqual(cmp.$el.html(), null);
        });
      });
    });
  });
});
