describe("A blank test for search", function() {
  it("should work", function(done) {
    SF.controller("search", function(ctrl) {
      assert.notEqual(ctrl, null);

      done();
    });
  });
});
