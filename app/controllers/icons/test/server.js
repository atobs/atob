describe("A blank test for icons", function() {
  it("should work", function(done) {
    SF.controller("icons", function(ctrl) {
      assert.notEqual(ctrl, null);

      done();
    });
  });
});
