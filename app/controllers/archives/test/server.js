describe("A blank test for archives", function() {
  it("should work", function(done) {
    SF.controller("archives", function(ctrl) {
      assert.notEqual(ctrl, null);

      done();
    });
  });
});
