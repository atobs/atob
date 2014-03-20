describe("A blank test for posts", function() {
  it("should work", function(done) {
    SF.controller("posts", function(ctrl) {
      assert.notEqual(ctrl, null);

      done();
    });
  });
});
