describe("A blank test for boards", function() {
  it("should work", function(done) {
    SF.controller("boards", function(ctrl) {
      assert.notEqual(ctrl, null);

      done();
    });
  });
});
